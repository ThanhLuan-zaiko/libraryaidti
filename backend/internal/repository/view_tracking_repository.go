package repository

import (
	"backend/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type viewTrackingRepository struct {
	db *gorm.DB
}

// NewViewTrackingRepository creates a new view tracking repository
func NewViewTrackingRepository(db *gorm.DB) domain.ViewTrackingRepository {
	return &viewTrackingRepository{db: db}
}

// RecordView saves a new article view (only if session_duration >= 30)
func (r *viewTrackingRepository) RecordView(view *domain.ArticleView) error {
	// Validate minimum session duration
	if !view.IsValid() {
		return gorm.ErrInvalidData
	}

	return r.db.Create(view).Error
}

// GetValidViewCount returns the count of valid views for an article
func (r *viewTrackingRepository) GetValidViewCount(articleID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.ArticleView{}).
		Where("article_id = ? AND session_duration >= 30", articleID).
		Count(&count).Error

	return count, err
}

// HasRecentView checks if the IP address has viewed this article recently
// This is used for deduplication - same IP won't count multiple times within the duration
func (r *viewTrackingRepository) HasRecentView(articleID uuid.UUID, ipAddress string, within time.Duration) (bool, error) {
	var count int64
	cutoffTime := time.Now().Add(-within)

	err := r.db.Model(&domain.ArticleView{}).
		Where("article_id = ? AND ip_address = ? AND viewed_at > ? AND session_duration >= 30",
			articleID, ipAddress, cutoffTime).
		Count(&count).Error

	return count > 0, err
}

// GetViewsByArticle returns all valid views for an article with pagination
func (r *viewTrackingRepository) GetViewsByArticle(articleID uuid.UUID, page, limit int) ([]domain.ArticleView, int64, error) {
	var views []domain.ArticleView
	var total int64

	// Count total valid views
	err := r.db.Model(&domain.ArticleView{}).
		Where("article_id = ? AND session_duration >= 30", articleID).
		Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated views
	offset := (page - 1) * limit
	err = r.db.Where("article_id = ? AND session_duration >= 30", articleID).
		Order("viewed_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&views).Error

	return views, total, err
}

// GetRecentViews returns recent valid views across all articles
func (r *viewTrackingRepository) GetRecentViews(limit int) ([]domain.ArticleView, error) {
	var views []domain.ArticleView

	err := r.db.Where("session_duration >= 30").
		Order("viewed_at DESC").
		Limit(limit).
		Find(&views).Error

	return views, err
}
