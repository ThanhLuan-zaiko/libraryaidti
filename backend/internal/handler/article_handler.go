package handler

import (
	"backend/internal/domain"
	"backend/internal/middleware"
	"backend/internal/utils"
	"backend/internal/ws"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ArticleHandler struct {
	service        domain.ArticleService
	imageProcessor *utils.ImageProcessor
	cache          *middleware.ResponseCache
	hub            *ws.Hub
}

func NewArticleHandler(service domain.ArticleService, cache *middleware.ResponseCache, hub *ws.Hub) *ArticleHandler {
	return &ArticleHandler{
		service:        service,
		imageProcessor: utils.NewImageProcessor(),
		cache:          cache,
		hub:            hub,
	}
}

// ArticleCreateRequest represents the request DTO with base64 images
type ArticleCreateRequest struct {
	Title             string               `json:"title" binding:"required"`
	Content           string               `json:"content" binding:"required"`
	Summary           string               `json:"summary" binding:"required"`
	Slug              string               `json:"slug"`
	CategoryID        *uuid.UUID           `json:"category_id" binding:"required"`
	Status            domain.ArticleStatus `json:"status"`
	IsFeatured        bool                 `json:"is_featured"`
	AllowComment      bool                 `json:"allow_comment"`
	Tags              []domain.Tag         `json:"tags" binding:"required,min=1"`
	Images            []Base64Image        `json:"images" binding:"required,min=1"` // base64 images
	SeoMetadata       *domain.SeoMetadata  `json:"seo_metadata"`
	RelatedArticleIDs []uuid.UUID          `json:"related_article_ids"`
}

type Base64Image struct {
	ImageData   string `json:"image_data"` // base64 encoded image
	ImageUrl    string `json:"image_url"`  // existing image URL
	Description string `json:"description"`
	IsPrimary   bool   `json:"is_primary"`
}

func (h *ArticleHandler) CreateArticle(c *gin.Context) {
	var req ArticleCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create article first to get ID
	article := domain.Article{
		Title:        req.Title,
		Content:      req.Content,
		Summary:      req.Summary,
		Slug:         req.Slug,
		Status:       req.Status,
		IsFeatured:   req.IsFeatured,
		AllowComment: req.AllowComment,
	}

	if req.CategoryID != nil {
		article.CategoryID = *req.CategoryID
	}

	// Set author from context
	authorIDStr, exists := c.Get("user_id")
	if exists {
		switch v := authorIDStr.(type) {
		case string:
			authorID, _ := uuid.Parse(v)
			article.AuthorID = authorID
		case uuid.UUID:
			article.AuthorID = v
		}
	}

	// Create article first (which creates initial version and status log)
	if err := h.service.CreateArticle(&article); err != nil {
		fmt.Printf("ERROR: CreateArticle failed: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Process and save images in parallel
	var mediaList []domain.ArticleMedia
	var articleImages []domain.ArticleImage

	// Use a channel to collect results and a semaphore to limit concurrency
	type processResult struct {
		index int
		media domain.ArticleMedia
		img   domain.ArticleImage
		err   error
	}

	resultsChan := make(chan processResult, len(req.Images))
	semaphore := make(chan struct{}, 3) // Max 3 concurrent image processing tasks

	for i, img := range req.Images {
		if img.ImageData == "" {
			continue
		}

		go func(idx int, imgReq Base64Image) {
			semaphore <- struct{}{}        // Acquire
			defer func() { <-semaphore }() // Release

			// Process base64 image
			imgInfo, err := h.imageProcessor.ProcessBase64Image(imgReq.ImageData, article.ID.String())
			if err != nil {
				resultsChan <- processResult{err: fmt.Errorf("image %d: %w", idx, err)}
				return
			}

			// Create MediaFile entry
			mediaFile := &domain.MediaFile{
				FileName:   imgInfo.FileName,
				FileURL:    imgInfo.URL,
				FileType:   imgInfo.Type,
				FileSize:   imgInfo.Size,
				UploadedBy: &article.AuthorID,
			}
			if err := h.service.CreateMediaFile(mediaFile); err != nil {
				resultsChan <- processResult{err: fmt.Errorf("image %d metadata: %w", idx, err)}
				return
			}

			usageType := "gallery"
			if imgReq.IsPrimary {
				usageType = "thumbnail"
			}

			resultsChan <- processResult{
				index: idx,
				media: domain.ArticleMedia{
					ArticleID: article.ID,
					MediaID:   mediaFile.ID,
					UsageType: usageType,
					Media:     mediaFile,
				},
				img: domain.ArticleImage{
					ArticleID:   article.ID,
					ImageURL:    imgInfo.URL,
					Description: imgReq.Description,
					IsPrimary:   imgReq.IsPrimary,
				},
			}
		}(i, img)
	}

	// Collect results and maintain order
	tempResults := make([]processResult, len(req.Images))
	for i := 0; i < len(req.Images); i++ {
		if req.Images[i].ImageData == "" {
			continue
		}
		res := <-resultsChan
		if res.err != nil {
			fmt.Printf("ERROR: Image processing failed at index %d: %v\n", res.index, res.err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process image: " + res.err.Error()})
			return
		}
		tempResults[res.index] = res
	}

	for _, res := range tempResults {
		if res.media.MediaID != uuid.Nil {
			mediaList = append(mediaList, res.media)
			articleImages = append(articleImages, res.img)
		}
	}

	// Handle Related Articles
	if len(req.RelatedArticleIDs) > 0 {
		// Deduplicate
		seen := make(map[uuid.UUID]bool)
		var uniqueIDs []uuid.UUID
		for _, id := range req.RelatedArticleIDs {
			if !seen[id] {
				seen[id] = true
				uniqueIDs = append(uniqueIDs, id)
			}
		}
		for _, relatedID := range uniqueIDs {
			article.Related = append(article.Related, &domain.Article{ID: relatedID})
		}
	}

	article.Images = articleImages
	article.MediaList = mediaList
	article.Tags = req.Tags
	if req.SeoMetadata != nil {
		req.SeoMetadata.ArticleID = article.ID
		article.SEOMetadata = req.SeoMetadata
	}

	// Update to save images, tags, SEO, and relations
	if err := h.service.UpdateArticle(&article); err != nil {
		fmt.Printf("ERROR: UpdateArticle failed during finalize: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update article with relations: " + err.Error()})
		return
	}

	// Invalidate cache and broadcast update
	h.cache.ClearByPrefix("/api/v1/articles")
	h.cache.ClearByPrefix("/api/v1/admin")
	h.hub.BroadcastEvent("admin_data_updated", gin.H{"module": "articles", "action": "create"})

	c.JSON(http.StatusCreated, article)
}

func (h *ArticleHandler) GetArticles(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if search := c.Query("search"); search != "" {
		filter["search"] = search
	}
	if categoryID := c.Query("category_id"); categoryID != "" {
		filter["category_id"] = categoryID
	}
	if minimal := c.Query("minimal"); minimal == "true" {
		filter["minimal"] = true
	}

	articles, total, err := h.service.GetArticles(page, limit, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": articles,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

func (h *ArticleHandler) GetArticle(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		// Try slug if not UUID
		article, err := h.service.GetArticleBySlug(idStr)
		if err != nil {
			// Check for redirect
			if dest, errRedir := h.service.GetRedirectDestination(idStr); errRedir == nil && dest != "" {
				c.Redirect(http.StatusMovedPermanently, "/api/v1/articles/"+dest)
				return
			}

			c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
			return
		}
		c.JSON(http.StatusOK, article)
		return
	}

	article, err := h.service.GetArticleByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	c.JSON(http.StatusOK, article)
}

func (h *ArticleHandler) UpdateArticle(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req ArticleCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing article
	article, err := h.service.GetArticleByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	oldMediaMap := make(map[string]domain.ArticleMedia)
	for _, m := range article.MediaList {
		oldMediaMap[m.Media.FileURL] = m
	}

	// Update fields
	article.Title = req.Title
	article.Content = req.Content
	article.Summary = req.Summary
	if req.Slug != "" {
		article.Slug = req.Slug
	}
	article.Status = req.Status
	article.IsFeatured = req.IsFeatured
	article.AllowComment = req.AllowComment

	if req.CategoryID != nil {
		article.CategoryID = *req.CategoryID
	}

	// Synchronize images
	var finalMediaList []domain.ArticleMedia
	var finalImageList []domain.ArticleImage

	// Use a channel to collect results for new images
	type processResult struct {
		index int
		media domain.ArticleMedia
		img   domain.ArticleImage
		err   error
	}

	resultsChan := make(chan processResult, len(req.Images))
	semaphore := make(chan struct{}, 3)

	for i, imgReq := range req.Images {
		if imgReq.ImageData != "" {
			// New base64 image - process in parallel
			go func(idx int, ir Base64Image) {
				semaphore <- struct{}{}
				defer func() { <-semaphore }()

				imgInfo, err := h.imageProcessor.ProcessBase64Image(ir.ImageData, article.ID.String())
				if err != nil {
					resultsChan <- processResult{err: fmt.Errorf("new image %d: %w", idx, err)}
					return
				}

				mediaFile := &domain.MediaFile{
					FileName:   imgInfo.FileName,
					FileURL:    imgInfo.URL,
					FileType:   imgInfo.Type,
					FileSize:   imgInfo.Size,
					UploadedBy: &article.AuthorID,
				}
				if err := h.service.CreateMediaFile(mediaFile); err != nil {
					resultsChan <- processResult{err: fmt.Errorf("new image %d metadata: %w", idx, err)}
					return
				}

				usageType := "gallery"
				if ir.IsPrimary {
					usageType = "thumbnail"
				}

				resultsChan <- processResult{
					index: idx,
					media: domain.ArticleMedia{
						ArticleID: article.ID,
						MediaID:   mediaFile.ID,
						UsageType: usageType,
						Media:     mediaFile,
					},
					img: domain.ArticleImage{
						ArticleID:   article.ID,
						ImageURL:    imgInfo.URL,
						Description: ir.Description,
						IsPrimary:   ir.IsPrimary,
					},
				}
			}(i, imgReq)
		} else if imgReq.ImageUrl != "" {
			// Existing image - handle synchronously as it doesn't need heavy processing
			if oldAM, ok := oldMediaMap[imgReq.ImageUrl]; ok {
				usageType := "gallery"
				if imgReq.IsPrimary {
					usageType = "thumbnail"
				}
				oldAM.UsageType = usageType

				resultsChan <- processResult{
					index: i,
					media: oldAM,
					img: domain.ArticleImage{
						ArticleID:   article.ID,
						ImageURL:    imgReq.ImageUrl,
						Description: imgReq.Description,
						IsPrimary:   imgReq.IsPrimary,
					},
				}
			} else {
				// Possibly an image URL from another source or already deleted?
				// For now, skip or handle as error. Let's send a dummy result to keep count.
				resultsChan <- processResult{index: i}
			}
		} else {
			// Empty entry? Send dummy to keep count.
			resultsChan <- processResult{index: i}
		}
	}

	// Collect all results and sort by index to preserve order
	tempResults := make([]processResult, len(req.Images))
	for i := 0; i < len(req.Images); i++ {
		res := <-resultsChan
		if res.err != nil {
			fmt.Printf("DEBUG: Update image processing failed at index %d: %v\n", res.index, res.err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process images: " + res.err.Error()})
			return
		}
		tempResults[res.index] = res
	}

	for _, res := range tempResults {
		if res.media.MediaID != uuid.Nil || res.media.ID != uuid.Nil {
			finalMediaList = append(finalMediaList, res.media)
			finalImageList = append(finalImageList, res.img)
		}
	}

	article.MediaList = finalMediaList
	article.Images = finalImageList
	article.Tags = req.Tags

	// Related Articles
	if len(req.RelatedArticleIDs) > 0 {
		article.Related = nil // Clear old
		// Deduplicate
		seen := make(map[uuid.UUID]bool)
		var uniqueIDs []uuid.UUID
		for _, id := range req.RelatedArticleIDs {
			if !seen[id] {
				seen[id] = true
				uniqueIDs = append(uniqueIDs, id)
			}
		}
		for _, relatedID := range uniqueIDs {
			article.Related = append(article.Related, &domain.Article{ID: relatedID})
		}
	} else {
		article.Related = nil
	}

	if req.SeoMetadata != nil {
		req.SeoMetadata.ArticleID = article.ID
		article.SEOMetadata = req.SeoMetadata
	}

	// Update
	if err := h.service.UpdateArticle(article); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate cache and broadcast update
	h.cache.ClearByPrefix("/api/v1/articles")
	h.cache.ClearByPrefix("/api/v1/admin")
	h.hub.BroadcastEvent("admin_data_updated", gin.H{"module": "articles", "action": "update"})

	c.JSON(http.StatusOK, article)
}

func (h *ArticleHandler) DeleteArticle(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	if err := h.service.DeleteArticle(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate cache and broadcast update
	h.cache.ClearByPrefix("/api/v1/articles")
	h.cache.ClearByPrefix("/api/v1/admin")
	h.hub.BroadcastEvent("admin_data_updated", gin.H{"module": "articles", "action": "delete"})

	c.JSON(http.StatusOK, gin.H{"message": "Article deleted successfully"})
}

func (h *ArticleHandler) ChangeStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req struct {
		Status domain.ArticleStatus `json:"status" binding:"required"`
		Note   string               `json:"note"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user who changed status
	var changedBy uuid.UUID
	userIDStr, exists := c.Get("user_id")
	if exists {
		switch v := userIDStr.(type) {
		case string:
			changedBy, _ = uuid.Parse(v)
		case uuid.UUID:
			changedBy = v
		}
	}

	if err := h.service.ChangeStatus(id, req.Status, changedBy, req.Note); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalidate cache and broadcast update
	h.cache.ClearByPrefix("/api/v1/articles")
	h.cache.ClearByPrefix("/api/v1/admin")
	h.hub.BroadcastEvent("admin_data_updated", gin.H{"module": "articles", "action": "change_status"})

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

func (h *ArticleHandler) AddRedirect(c *gin.Context) {
	idStr := c.Param("id")
	articleID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req struct {
		FromSlug string `json:"from_slug" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateArticleRedirect(articleID, req.FromSlug); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Redirect created successfully"})
}

func (h *ArticleHandler) DeleteRedirect(c *gin.Context) {
	redirectIDStr := c.Param("redirectId")
	redirectID, err := uuid.Parse(redirectIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	if err := h.service.DeleteArticleRedirect(redirectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Redirect deleted successfully"})
}

// GetArticleRelations returns all incoming and outgoing relations for an article
func (h *ArticleHandler) GetArticleRelations(c *gin.Context) {
	idStr := c.Param("id")
	articleID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	type RelatedArticleInfo struct {
		ID    uuid.UUID `json:"id"`
		Title string    `json:"title"`
		Slug  string    `json:"slug"`
	}

	type RelationDetail struct {
		IncomingArticles []RelatedArticleInfo `json:"incoming_articles"`
		OutgoingArticles []RelatedArticleInfo `json:"outgoing_articles"`
	}

	// Get the article with its outgoing relations
	article, err := h.service.GetArticleByID(articleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}

	result := RelationDetail{
		IncomingArticles: make([]RelatedArticleInfo, 0),
		OutgoingArticles: make([]RelatedArticleInfo, 0),
	}

	// Outgoing: articles this article links to (from Related field)
	for _, related := range article.Related {
		if related != nil {
			result.OutgoingArticles = append(result.OutgoingArticles, RelatedArticleInfo{
				ID:    related.ID,
				Title: related.Title,
				Slug:  related.Slug,
			})
		}
	}

	// For incoming, we need to query articles that have this article in their Related
	// Since we can't do reverse lookup easily without repository method,
	// let's return what we have for now (outgoing only)
	// TODO: Add repository method to get incoming relations

	c.JSON(http.StatusOK, result)
}
