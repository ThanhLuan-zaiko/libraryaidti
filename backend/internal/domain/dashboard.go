package domain

import (
	"time"

	"github.com/google/uuid"
)

// Renaming key structs to ensure uniqueness and clarity
type DashboardAnalyticsData struct {
	TotalArticles   int64           `json:"total_articles"`
	TotalViews      int64           `json:"total_views"`
	TotalComments   int64           `json:"total_comments"`
	TotalCategories int64           `json:"total_categories"`
	TotalReaders    int64           `json:"total_readers"`
	ArticleTrend    []ArticleTrend  `json:"article_trend"`
	TopCategories   []CategoryStats `json:"top_categories"`
	TopTags         []TagStats      `json:"top_tags"`
}

type ArticleRelationStats struct {
	TopIncomingLinks []struct {
		ArticleID     string `json:"article_id"`
		ArticleTitle  string `json:"article_title"`
		IncomingCount int64  `json:"incoming_count"`
	} `json:"top_incoming_links"`

	TopOutgoingLinks []struct {
		ArticleID     string `json:"article_id"`
		ArticleTitle  string `json:"article_title"`
		OutgoingCount int64  `json:"outgoing_count"`
	} `json:"top_outgoing_links"`

	CategoryRelations []struct {
		CategoryName  string `json:"category_name"`
		RelationCount int64  `json:"relation_count"`
	} `json:"category_relations"`

	BidirectionalStats struct {
		TotalLinks         int64   `json:"total_links"`
		BidirectionalLinks int64   `json:"bidirectional_links"`
		BidirectionalRatio float64 `json:"bidirectional_ratio"`
	} `json:"bidirectional_stats"`
}

type AdvancedAnalyticsData struct {
	SEOStats struct {
		MissingMetaDescription int64 `json:"missing_meta_description"`
		MissingOGImage         int64 `json:"missing_og_image"`
		TotalSEORecords        int64 `json:"total_seo_records"`
	} `json:"seo_stats"`
	WorkflowStats []struct {
		Status  string  `json:"status"`
		AvgDays float64 `json:"avg_days"`
	} `json:"workflow_stats"`
	MediaStats struct {
		TotalFiles int64 `json:"total_files"`
		TotalSize  int64 `json:"total_size"`
	} `json:"media_stats"`
	VersioningStats struct {
		AvgEditsPerArticle float64 `json:"avg_edits_per_article"`
		TotalVersions      int64   `json:"total_versions"`
	} `json:"versioning_stats"`
	ContentGraph struct {
		TotalRelations     int64   `json:"total_relations"`
		OrphanPages        int64   `json:"orphan_pages"`
		AvgLinksPerArticle float64 `json:"avg_links_per_article"`
	} `json:"content_graph"`
	ContentHealth struct {
		AvgTagDensity     float64 `json:"avg_tag_density"`
		GoodContentLength int64   `json:"good_content_length"`
		MissingCanonical  int64   `json:"missing_canonical"`
	} `json:"content_health"`
	RelationStats ArticleRelationStats `json:"relation_stats"`
}

type ArticleTrend struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type AuditLog struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Action    string    `json:"action"`
	TableName string    `json:"table_name"`
	RecordID  uuid.UUID `json:"record_id"`
	CreatedAt time.Time `json:"created_at"`
}

type EngagementStats struct {
	TotalComments   int64 `json:"total_comments"`
	SpamComments    int64 `json:"spam_comments"`
	DeletedComments int64 `json:"deleted_comments"`
	TotalShares     int64 `json:"total_shares"`
	FeaturedCount   int64 `json:"featured_count"`
}

type SystemAnalytics struct {
	RecentAuditLogs []AuditLog `json:"recent_audit_logs"`
	TotalLogs       int64      `json:"total_logs"`
}

type SystemPulse struct {
	CPUUsage      float64 `json:"cpu_usage"`
	MemoryUsage   uint64  `json:"memory_usage"` // in bytes
	GoRoutines    int     `json:"goroutines"`
	DBConnections int     `json:"db_connections"` // Open connections
	UptimeSeconds int64   `json:"uptime_seconds"`
	LastRestart   string  `json:"last_restart"`
}

type ActivityHeatmap struct {
	Day  string `json:"day"`  // "Monday", "Tuesday", etc.
	Hour int    `json:"hour"` // 0-23
	Hits int64  `json:"hits"`
}

type EditorialSpeed struct {
	DraftToPublishDays float64 `json:"draft_to_publish_days"`
	TotalPublished     int64   `json:"total_published"`
}

type SuperDashboardData struct {
	Stats             DashboardAnalyticsData `json:"stats"`
	Advanced          AdvancedAnalyticsData  `json:"advanced"`
	UserStats         UserStats              `json:"user_stats"`
	CategoryTree      []CategoryNode         `json:"category_tree"`
	CategoryHierarchy CategoryHierarchyStats `json:"category_hierarchy"`
	Engagement        EngagementStats        `json:"engagement"`
	System            SystemAnalytics        `json:"system"`
	Pulse             SystemPulse            `json:"pulse"`    // Data for Command Center
	Heatmap           []ActivityHeatmap      `json:"heatmap"`  // Data for Command Center
	Velocity          EditorialSpeed         `json:"velocity"` // Data for Command Center
}

type DashboardRepository interface {
	GetAnalytics() (*DashboardAnalyticsData, error)
	GetAdvancedAnalytics() (*AdvancedAnalyticsData, error)
	GetCategoryHierarchyStats() (*CategoryHierarchyStats, error)
	GetCategoryTree() ([]CategoryNode, error)
	GetSuperDashboard() (*SuperDashboardData, error)
}

type DashboardService interface {
	GetAnalytics() (*DashboardAnalyticsData, error)
	GetAdvancedAnalytics() (*AdvancedAnalyticsData, error)
	GetCategoryHierarchyStats() (*CategoryHierarchyStats, error)
	GetCategoryTree() ([]CategoryNode, error)
	GetSuperDashboard() (*SuperDashboardData, error)
	ExportDashboardData() ([]byte, error)
}

type AuditRepository interface {
	Create(log *AuditLog) error
}
