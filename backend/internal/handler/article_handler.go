package handler

import (
	"backend/internal/domain"
	"backend/internal/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ArticleHandler struct {
	service        domain.ArticleService
	imageProcessor *utils.ImageProcessor
}

func NewArticleHandler(service domain.ArticleService) *ArticleHandler {
	return &ArticleHandler{
		service:        service,
		imageProcessor: utils.NewImageProcessor(),
	}
}

// ArticleCreateRequest represents the request DTO with base64 images
type ArticleCreateRequest struct {
	Title             string               `json:"title" binding:"required"`
	Content           string               `json:"content" binding:"required"`
	Summary           string               `json:"summary"`
	Slug              string               `json:"slug"`
	CategoryID        *uuid.UUID           `json:"category_id"`
	Status            domain.ArticleStatus `json:"status"`
	IsFeatured        bool                 `json:"is_featured"`
	AllowComment      bool                 `json:"allow_comment"`
	Tags              []domain.Tag         `json:"tags"`
	Images            []Base64Image        `json:"images"` // base64 images
	SeoMetadata       *domain.SeoMetadata  `json:"seo_metadata"`
	RelatedArticleIDs []uuid.UUID          `json:"related_article_ids"`
}

type Base64Image struct {
	ImageData string `json:"image_data"` // base64 encoded image
	ImageUrl  string `json:"image_url"`  // existing image URL
	IsPrimary bool   `json:"is_primary"`
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Process and save images
	var mediaList []domain.ArticleMedia
	var articleImages []domain.ArticleImage

	for _, img := range req.Images {
		if img.ImageData != "" {
			// Process base64 image
			imgInfo, err := h.imageProcessor.ProcessBase64Image(img.ImageData, article.ID.String())
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process image: " + err.Error()})
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
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image metadata: " + err.Error()})
				return
			}

			usageType := "gallery"
			if img.IsPrimary {
				usageType = "thumbnail"
			}

			// Add to ArticleMedia list
			mediaList = append(mediaList, domain.ArticleMedia{
				ArticleID: article.ID,
				MediaID:   mediaFile.ID,
				UsageType: usageType,
				Media:     mediaFile,
			})

			// Also add to ArticleImage list for article_images table
			articleImages = append(articleImages, domain.ArticleImage{
				ArticleID: article.ID,
				ImageURL:  imgInfo.URL,
				IsPrimary: img.IsPrimary,
			})
		}
	}

	// Handle Related Articles
	if len(req.RelatedArticleIDs) > 0 {
		for _, relatedID := range req.RelatedArticleIDs {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update article with relations"})
		return
	}

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
	article.Slug = req.Slug
	article.Status = req.Status
	article.IsFeatured = req.IsFeatured
	article.AllowComment = req.AllowComment

	if req.CategoryID != nil {
		article.CategoryID = *req.CategoryID
	}

	// Synchronize images
	var finalMediaList []domain.ArticleMedia

	// Process images from request
	for _, imgReq := range req.Images {
		if imgReq.ImageData != "" {
			// New base64 image
			imgInfo, err := h.imageProcessor.ProcessBase64Image(imgReq.ImageData, article.ID.String())
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process image: " + err.Error()})
				return
			}

			// Create MediaFile
			mediaFile := &domain.MediaFile{
				FileName:   imgInfo.FileName,
				FileURL:    imgInfo.URL,
				FileType:   imgInfo.Type,
				FileSize:   imgInfo.Size,
				UploadedBy: &article.AuthorID,
			}
			if err := h.service.CreateMediaFile(mediaFile); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image metadata: " + err.Error()})
				return
			}

			usageType := "gallery"
			if imgReq.IsPrimary {
				usageType = "thumbnail"
			}

			finalMediaList = append(finalMediaList, domain.ArticleMedia{
				ArticleID: article.ID,
				MediaID:   mediaFile.ID,
				UsageType: usageType,
			})
		} else if imgReq.ImageUrl != "" {
			// Existing image URL
			// Find corresponding MediaFile/ArticleMedia
			if oldAM, ok := oldMediaMap[imgReq.ImageUrl]; ok {
				// Update usage type if changed
				if imgReq.IsPrimary {
					oldAM.UsageType = "thumbnail"
				} else {
					oldAM.UsageType = "gallery"
				}
				finalMediaList = append(finalMediaList, oldAM)
			}
		}
	}

	article.MediaList = finalMediaList
	article.Tags = req.Tags

	// Related Articles
	if len(req.RelatedArticleIDs) > 0 {
		article.Related = nil // Clear old
		for _, relatedID := range req.RelatedArticleIDs {
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

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}
