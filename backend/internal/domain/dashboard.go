package domain

// Renaming key structs to ensure uniqueness and clarity
type DashboardAnalyticsData struct {
	TotalArticles int64           `json:"total_articles"`
	TotalViews    int64           `json:"total_views"`
	TotalComments int64           `json:"total_comments"`
	ArticleTrend  []ArticleTrend  `json:"article_trend"`
	TopCategories []CategoryStats `json:"top_categories"`
	TopTags       []TagStats      `json:"top_tags"`
}

type ArticleTrend struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type DashboardRepository interface {
	GetAnalytics() (*DashboardAnalyticsData, error)
}

type DashboardService interface {
	GetAnalytics() (*DashboardAnalyticsData, error)
}
