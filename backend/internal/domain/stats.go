package domain

import "time"

type AdminStats struct {
	TotalArticles   int64   `json:"total_articles"`
	TotalReaders    int64   `json:"total_readers"`
	TotalCategories int64   `json:"total_categories"`
	PendingPosts    int64   `json:"pending_posts"`
	ArticleTrend    float64 `json:"article_trend"`
	ReaderTrend     float64 `json:"reader_trend"`
}

type AdminActivity struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"` // "article_published", "user_registered", "article_updated"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	User      string    `json:"user"`
}

type AnalyticsData struct {
	Date     string `json:"date"`
	Articles int64  `json:"articles"`
	Views    int64  `json:"views"`
}

type CategoryDistribution struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}

type DashboardData struct {
	Stats                AdminStats             `json:"stats"`
	Activities           []AdminActivity        `json:"activities"`
	Analytics            []AnalyticsData        `json:"analytics"`
	CategoryDistribution []CategoryDistribution `json:"category_distribution"`
}

type StatsRepository interface {
	GetAdminStats() (*AdminStats, error)
	GetRecentActivities(limit int) ([]AdminActivity, error)
	GetAnalytics(days int) ([]AnalyticsData, error)
	GetCategoryDistribution() ([]CategoryDistribution, error)
}

type StatsService interface {
	GetDashboardData() (*DashboardData, error)
}
