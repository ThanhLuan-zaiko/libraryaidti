package domain

import (
	"time"

	"github.com/google/uuid"
)

// ArticleView represents a single view of an article
type ArticleView struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArticleID       uuid.UUID `gorm:"type:uuid;not null" json:"article_id"`
	IPAddress       string    `gorm:"type:inet" json:"ip_address"`
	UserAgent       string    `gorm:"type:text" json:"user_agent"`
	SessionDuration int       `gorm:"type:integer" json:"session_duration"` // Duration in seconds
	ViewedAt        time.Time `gorm:"default:now()" json:"viewed_at"`
}

// TableName specifies the table name for ArticleView
func (ArticleView) TableName() string {
	return "article_views"
}

// IsValid checks if the view meets the minimum duration requirement
func (v *ArticleView) IsValid() bool {
	return v.SessionDuration >= 30
}

// ViewTrackingRepository defines the interface for view tracking data access
type ViewTrackingRepository interface {
	// RecordView saves a new article view (only if session_duration >= 30)
	RecordView(view *ArticleView) error

	// GetValidViewCount returns the count of valid views for an article
	GetValidViewCount(articleID uuid.UUID) (int64, error)

	// HasRecentView checks if the IP address has viewed this article recently
	HasRecentView(articleID uuid.UUID, ipAddress string, within time.Duration) (bool, error)

	// GetViewsByArticle returns all valid views for an article with pagination
	GetViewsByArticle(articleID uuid.UUID, page, limit int) ([]ArticleView, int64, error)

	// GetRecentViews returns recent valid views across all articles
	GetRecentViews(limit int) ([]ArticleView, error)
}

// ViewTrackingService defines the business logic interface for view tracking
type ViewTrackingService interface {
	// TrackView processes and records a view if it meets all criteria
	TrackView(articleSlug string, ipAddress string, userAgent string, sessionDuration int) error

	// GetArticleViewCount returns the count of valid views for an article by slug
	GetArticleViewCount(articleSlug string) (int64, error)

	// GetArticleViewCountByID returns the count of valid views for an article by ID
	GetArticleViewCountByID(articleID uuid.UUID) (int64, error)
}
