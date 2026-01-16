package service

import (
	"backend/internal/domain"
	"errors"
	"time"

	"github.com/google/uuid"
)

type viewTrackingService struct {
	viewRepo    domain.ViewTrackingRepository
	articleRepo domain.ArticleRepository
}

// NewViewTrackingService creates a new view tracking service
func NewViewTrackingService(
	viewRepo domain.ViewTrackingRepository,
	articleRepo domain.ArticleRepository,
) domain.ViewTrackingService {
	return &viewTrackingService{
		viewRepo:    viewRepo,
		articleRepo: articleRepo,
	}
}

// TrackView processes and records a view if it meets all criteria
func (s *viewTrackingService) TrackView(identifier string, ipAddress string, userAgent string, sessionDuration int) error {
	// 1. Validate minimum session duration (30 seconds)
	if sessionDuration < 30 {
		return errors.New("session duration must be at least 30 seconds")
	}

	// 2. Get article by ID or Slug
	var article *domain.Article
	var err error

	if id, errParse := uuid.Parse(identifier); errParse == nil {
		article, err = s.articleRepo.GetByID(id)
	} else {
		article, err = s.articleRepo.GetBySlug(identifier)
	}

	if err != nil || article == nil {
		return errors.New("article not found")
	}

	// 3. Check for duplicate view within 24 hours (deduplication)
	// Same IP address cannot count multiple times within 24h
	hasRecent, err := s.viewRepo.HasRecentView(article.ID, ipAddress, 24*time.Hour)
	if err != nil {
		return err
	}

	if hasRecent {
		// Silent ignore - don't throw error to maintain smooth UX
		// The view is valid but we don't count duplicates
		return nil
	}

	// 4. Record view
	view := &domain.ArticleView{
		ArticleID:       article.ID,
		IPAddress:       ipAddress,
		UserAgent:       userAgent,
		SessionDuration: sessionDuration,
		ViewedAt:        time.Now(),
	}

	if err := s.viewRepo.RecordView(view); err != nil {
		return err
	}

	// 5. Increment denormalized view_count in articles table for display
	return s.articleRepo.IncrementViewCount(article.ID)
}

// GetArticleViewCount returns the count of valid views for an article by slug
func (s *viewTrackingService) GetArticleViewCount(articleSlug string) (int64, error) {
	// Get article by slug
	article, err := s.articleRepo.GetBySlug(articleSlug)
	if err != nil {
		return 0, errors.New("article not found")
	}

	return s.viewRepo.GetValidViewCount(article.ID)
}

// GetArticleViewCountByID returns the count of valid views for an article by ID
func (s *viewTrackingService) GetArticleViewCountByID(articleID uuid.UUID) (int64, error) {
	return s.viewRepo.GetValidViewCount(articleID)
}
