package service

import (
	"backend/internal/domain"
	"backend/internal/utils"
	"backend/internal/ws"
	"errors"
	"fmt"
	"time"

	"strings"

	"github.com/google/uuid"
)

type articleService struct {
	repo           domain.ArticleRepository
	mediaRepo      domain.MediaRepository
	auditRepo      domain.AuditRepository
	seoService     domain.SeoService
	imageProcessor *utils.ImageProcessor
	hub            *ws.Hub // Directly using Hub for simplicity
}

func NewArticleService(repo domain.ArticleRepository, mediaRepo domain.MediaRepository, auditRepo domain.AuditRepository, seoService domain.SeoService, hub *ws.Hub) domain.ArticleService {
	return &articleService{
		repo:           repo,
		mediaRepo:      mediaRepo,
		auditRepo:      auditRepo,
		seoService:     seoService,
		imageProcessor: utils.NewImageProcessor(),
		hub:            hub,
	}
}

func (s *articleService) CreateArticle(article *domain.Article) error {
	// 1. Generate Slug if empty
	if article.Slug == "" {
		article.Slug = utils.GenerateSlug(article.Title)
	}
	// Check slug uniqueness
	existing, _ := s.repo.GetBySlug(article.Slug)
	if existing != nil {
		return errors.New("đường dẫn này đã tồn tại")
	}

	// 2. Set Default Values
	if article.Status == "" {
		article.Status = domain.StatusDraft
	}

	now := time.Now()
	if article.Status == domain.StatusPublished && article.PublishedAt == nil {
		article.PublishedAt = &now
	}

	// 3. Create Initial Version
	article.Versions = []domain.ArticleVersion{
		{
			Title:         article.Title,
			Content:       article.Content,
			Summary:       article.Summary,
			VersionNumber: 1,
			CreatedBy:     article.AuthorID,
		},
	}

	// 4. Create Initial Status Log
	article.StatusLogs = []domain.ArticleStatusLog{
		{
			OldStatus: "",
			NewStatus: article.Status,
			ChangedBy: article.AuthorID,
			Note:      "Article created",
		},
	}

	// 5. Auto-fill SEO Metadata
	s.ensureSEOMetadata(article)

	// 5.5 Calculate Metrics
	s.calculateArticleMetrics(article)

	// 6. Create
	if err := s.repo.Create(article); err != nil {
		return err
	}

	// 7. Broadcast Event
	s.broadcastEvent("article_created", article)

	// 8. Log Action
	if err := s.auditRepo.Create(&domain.AuditLog{
		ID:        uuid.New(),
		UserID:    article.AuthorID,
		Action:    "CREATE",
		TableName: "articles",
		RecordID:  article.ID,
		CreatedAt: time.Now(),
	}); err != nil {
	}

	return nil
}

func (s *articleService) GetArticles(page, limit int, filter map[string]interface{}) ([]domain.Article, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	return s.repo.GetAll(offset, limit, filter)
}

func (s *articleService) GetArticleByID(id uuid.UUID) (*domain.Article, error) {
	article, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if article != nil && (article.Complexity == 0 || article.Depth == 0 || article.Impact == 0) {
		s.calculateArticleMetrics(article)
	}
	return article, nil
}

func (s *articleService) GetArticleBySlug(slug string) (*domain.Article, error) {
	article, err := s.repo.GetBySlug(slug)
	if err != nil {
		return nil, err
	}
	if article != nil && (article.Complexity == 0 || article.Depth == 0 || article.Impact == 0) {
		s.calculateArticleMetrics(article)
	}
	return article, nil
}

func (s *articleService) UpdateArticle(article *domain.Article) error {
	existing, err := s.repo.GetByID(article.ID)
	if err != nil {
		return err
	}

	if existing.Slug != article.Slug {
		if err := s.seoService.CreateArticleRedirect(article.ID, existing.Slug, article.Slug); err != nil {
			return err
		}
	}

	// Versioning Check
	if existing.Content != article.Content || existing.Title != article.Title {
		version := domain.ArticleVersion{
			ArticleID:     article.ID,
			Title:         existing.Title,
			Content:       existing.Content,
			Summary:       existing.Summary,
			VersionNumber: len(existing.Versions) + 1,
			CreatedBy:     existing.AuthorID, // Note: ideally we want the updater's ID here
			CreatedAt:     time.Now(),
		}
		// Append to list to be saved by repo
		article.Versions = append(existing.Versions, version)
	}

	if article.Status == "" {
		article.Status = existing.Status
	}

	// Ensure SEO Metadata (OG Image might be available now after image upload)
	s.ensureSEOMetadata(article)

	// Calculate Metrics
	s.calculateArticleMetrics(article)

	// Detect removed media and cleanup
	newMediaMap := make(map[uuid.UUID]bool)
	for _, m := range article.MediaList {
		if m.MediaID != uuid.Nil {
			newMediaMap[m.MediaID] = true
		}
	}

	for _, oldMedia := range existing.MediaList {
		if !newMediaMap[oldMedia.MediaID] {
			// Media was removed, cleanup file and record
			if oldMedia.Media != nil {
				s.imageProcessor.DeleteImage(oldMedia.Media.FileURL)
				s.mediaRepo.DeleteMediaByUrl(oldMedia.Media.FileURL)
			}
		}
	}

	if err := s.repo.Update(article); err != nil {
		return err
	}

	// Media Versioning (Move AFTER update to ensure IDs are populated)
	if len(article.MediaList) > 0 {
		for _, am := range article.MediaList {
			// Skip if ArticleMedia ID is still nil (should be populated after Update)
			if am.ID != uuid.Nil {
				amVersion := domain.ArticleMediaVersion{
					ArticleMediaID: am.ID,
					ArticleID:      article.ID,
					MediaID:        am.MediaID,
					UsageType:      am.UsageType,
				}
				s.mediaRepo.CreateMediaVersion(&amVersion)

				// Also create MediaFile version if we have the media object
				if am.Media != nil && am.Media.ID != uuid.Nil {
					uploadedBy := uuid.Nil
					if am.Media.UploadedBy != nil {
						uploadedBy = *am.Media.UploadedBy
					}

					mfVersion := domain.MediaFileVersion{
						MediaFileID: am.MediaID,
						FileName:    am.Media.FileName,
						FileURL:     am.Media.FileURL,
						FileType:    am.Media.FileType,
						FileSize:    am.Media.FileSize,
						UploadedBy:  uploadedBy,
						CreatedAt:   time.Now(),
					}
					s.mediaRepo.CreateMediaFileVersion(&mfVersion)
				}
			}
		}
	}

	s.broadcastEvent("article_updated", article)

	return nil
}

func (s *articleService) ensureSEOMetadata(article *domain.Article) {
	if article.SEOMetadata == nil {
		article.SEOMetadata = &domain.SeoMetadata{}
	}
	// Only fill if empty (Same logic as Create)
	if article.SEOMetadata.MetaTitle == "" {
		article.SEOMetadata.MetaTitle = article.Title
	}
	if article.SEOMetadata.MetaDescription == "" {
		desc := article.Summary
		if desc == "" && len(article.Content) > 0 {
			if len(article.Content) > 160 {
				desc = article.Content[:157] + "..."
			} else {
				desc = article.Content
			}
		}
		article.SEOMetadata.MetaDescription = desc
	}
	if article.SEOMetadata.CanonicalURL == "" && article.Slug != "" {
		article.SEOMetadata.CanonicalURL = "/articles/" + article.Slug
	}
	if article.SEOMetadata.MetaKeywords == "" && len(article.Tags) > 0 {
		var tagNames []string
		for _, tag := range article.Tags {
			tagNames = append(tagNames, tag.Name)
		}
		article.SEOMetadata.MetaKeywords = strings.Join(tagNames, ", ")
	}

	// Auto-fill OG Image from article images
	if article.SEOMetadata.OgImage == "" && len(article.Images) > 0 {
		// Find primary image first
		for _, img := range article.Images {
			if img.IsPrimary && img.ImageURL != "" {
				article.SEOMetadata.OgImage = img.ImageURL
				break
			}
		}
		// If no primary found, use first image
		if article.SEOMetadata.OgImage == "" && article.Images[0].ImageURL != "" {
			article.SEOMetadata.OgImage = article.Images[0].ImageURL
		}
	}
}

func (s *articleService) DeleteArticle(id uuid.UUID) error {
	// Get article with media to cleanup
	article, err := s.repo.GetByID(id)
	if err == nil && article != nil {
		// Cleanup physical directory for this article
		s.imageProcessor.CleanupArticleImages(id.String())

		// Cleanup media records
		for _, am := range article.MediaList {
			s.mediaRepo.DeleteMediaByUrl(am.Media.FileURL)
		}
	}

	if err := s.repo.Delete(id); err != nil {
		return err
	}
	s.broadcastEvent("article_deleted", map[string]interface{}{"id": id})
	return nil
}

func (s *articleService) ChangeStatus(id uuid.UUID, newStatus domain.ArticleStatus, changedBy uuid.UUID, note string) error {
	article, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if article.Status == newStatus {
		return nil
	}

	oldStatus := article.Status
	article.Status = newStatus

	now := time.Now()
	if newStatus == domain.StatusPublished && article.PublishedAt == nil {
		article.PublishedAt = &now
	}

	log := domain.ArticleStatusLog{
		ArticleID: id,
		OldStatus: oldStatus,
		NewStatus: newStatus,
		ChangedBy: changedBy,
		Note:      note,
	}
	article.StatusLogs = append(article.StatusLogs, log)

	if err := s.repo.Update(article); err != nil {
		return err
	}

	// Broadcast
	s.broadcastEvent("article_status_changed", map[string]interface{}{
		"id":         id,
		"old_status": oldStatus,
		"new_status": newStatus,
	})

	return nil
}

func (s *articleService) CreateMediaFile(media *domain.MediaFile) error {
	return s.mediaRepo.CreateMediaFile(media)
}

func (s *articleService) DeleteMediaByUrl(url string) error {
	return s.mediaRepo.DeleteMediaByUrl(url)
}

func (s *articleService) broadcastEvent(eventType string, payload interface{}) {
	s.hub.Broadcast <- []byte(fmt.Sprintf(`{"type":"%s","payload":%v}`, eventType, utils.ToJSON(payload)))
}

func (s *articleService) CreateArticleRedirect(articleID uuid.UUID, fromSlug string) error {
	article, err := s.repo.GetByID(articleID)
	if err != nil {
		return err
	}
	return s.seoService.CreateArticleRedirect(articleID, fromSlug, article.Slug)
}

func (s *articleService) DeleteArticleRedirect(redirectID uuid.UUID) error {
	return s.seoService.DeleteArticleRedirect(redirectID)
}

func (s *articleService) GetRedirectDestination(slug string) (string, error) {
	return s.seoService.GetDestination(slug)
}

func (s *articleService) GetArticleRelations(id uuid.UUID) ([]domain.RelatedArticleInfo, []domain.RelatedArticleInfo, error) {
	incoming, err := s.repo.GetIncomingRelations(id)
	if err != nil {
		return nil, nil, err
	}

	outgoing, err := s.repo.GetOutgoingRelations(id)
	if err != nil {
		return nil, nil, err
	}

	return incoming, outgoing, nil
}

func (s *articleService) GetTrendingArticles(limit int) ([]domain.Article, error) {
	if limit <= 0 {
		limit = 10
	}
	return s.repo.GetTrending(limit)
}

func (s *articleService) GetDiscussedArticles(limit int) ([]domain.Article, error) {
	if limit <= 0 {
		limit = 10
	}
	return s.repo.GetDiscussed(limit)
}

func (s *articleService) GetRandomArticles(limit int) ([]domain.Article, error) {
	return s.repo.GetRandom(limit)
}

func (s *articleService) calculateArticleMetrics(article *domain.Article) {
	if article.Content == "" {
		return
	}

	// 1. Calculate Depth (based on content length and media)
	contentLen := len(article.Content)
	imageCount := len(article.Images)
	depth := (contentLen / 500) + (imageCount * 10)
	if depth < 30 {
		depth = 30 + (contentLen % 20)
	}
	if depth > 100 {
		depth = 95 + (contentLen % 5)
	}
	article.Depth = depth

	// 2. Calculate Complexity (based on unique words and sentence structure)
	words := strings.Fields(article.Content)
	uniqueWords := make(map[string]bool)
	for _, w := range words {
		uniqueWords[strings.ToLower(w)] = true
	}

	complexity := (len(uniqueWords) / 100) + (len(article.Tags) * 5)
	if complexity < 40 {
		complexity = 45 + (len(words) % 25)
	}
	if complexity > 100 {
		complexity = 90 + (len(words) % 10)
	}
	article.Complexity = complexity

	// 3. Calculate Impact (base on views, comments, and current time vs publish time)
	impact := (article.ViewCount / 20) + (article.CommentCount * 5)
	if impact < 50 {
		impact = 60 + (article.ViewCount % 20) // Give it a high baseline for premium feel
	}
	if impact > 100 {
		impact = 98
	}
	article.Impact = impact
}
