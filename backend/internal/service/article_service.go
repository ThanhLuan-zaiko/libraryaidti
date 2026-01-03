package service

import (
	"backend/internal/domain"
	"backend/internal/utils"
	"backend/internal/ws"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type articleService struct {
	repo       domain.ArticleRepository
	mediaRepo  domain.MediaRepository
	auditRepo  domain.AuditRepository
	seoService domain.SeoService
	hub        *ws.Hub // Directly using Hub for simplicity
}

func NewArticleService(repo domain.ArticleRepository, mediaRepo domain.MediaRepository, auditRepo domain.AuditRepository, seoService domain.SeoService, hub *ws.Hub) domain.ArticleService {
	return &articleService{
		repo:       repo,
		mediaRepo:  mediaRepo,
		auditRepo:  auditRepo,
		seoService: seoService,
		hub:        hub,
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
		return errors.New("slug already exists")
	}

	// 2. Set Default Values
	if article.Status == "" {
		article.Status = domain.StatusDraft
	}

	now := time.Now()
	if article.Status == domain.StatusPublished && article.PublishedAt == nil {
		article.PublishedAt = &now
	}

	// 3. Create
	if err := s.repo.Create(article); err != nil {
		return err
	}

	// 4. Broadcast Event
	s.broadcastEvent("article_created", article)

	// 4. Log Action
	if err := s.auditRepo.Create(&domain.AuditLog{
		ID:        uuid.New(),
		UserID:    article.AuthorID,
		Action:    "CREATE",
		TableName: "articles",
		RecordID:  article.ID,
		CreatedAt: time.Now(),
	}); err != nil {
		// Log error but don't fail request
		// log.Printf("Failed to create audit log: %v", err)
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
	return s.repo.GetByID(id)
}

func (s *articleService) GetArticleBySlug(slug string) (*domain.Article, error) {
	return s.repo.GetBySlug(slug)
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

	if existing.Content != article.Content || existing.Title != article.Title {
		version := domain.ArticleVersion{
			ArticleID:     article.ID,
			Title:         existing.Title,
			Content:       existing.Content,
			Summary:       existing.Summary,
			VersionNumber: len(existing.Versions) + 1,
			CreatedBy:     existing.AuthorID, // Or current user if we had context here
		}
		article.Versions = append(article.Versions, version)
	}

	if article.Status == "" {
		article.Status = existing.Status
	}

	if err := s.repo.Update(article); err != nil {
		return err
	}

	s.broadcastEvent("article_updated", article)

	return nil
}

func (s *articleService) DeleteArticle(id uuid.UUID) error {
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

	// Create Status Log
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
