package repository

import (
	"backend/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type dashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) domain.DashboardRepository {
	return &dashboardRepository{db: db}
}

func (r *dashboardRepository) GetAnalytics() (*domain.DashboardAnalyticsData, error) {
	var data domain.DashboardAnalyticsData

	// 1. Total Articles
	if err := r.db.Model(&domain.Article{}).Count(&data.TotalArticles).Error; err != nil {
		return nil, err
	}

	// 2. Total Views (Sum of view_count from article_stats)
	if err := r.db.Table("article_stats").Select("COALESCE(SUM(view_count), 0)").Scan(&data.TotalViews).Error; err != nil {
		return nil, err
	}

	// 3. Total Comments
	if err := r.db.Model(&domain.Comment{}).Count(&data.TotalComments).Error; err != nil {
		return nil, err
	}

	// 4. Total Categories
	if err := r.db.Model(&domain.Category{}).Count(&data.TotalCategories).Error; err != nil {
		return nil, err
	}

	// 5. Total Readers (Active Users)
	if err := r.db.Model(&domain.User{}).Where("is_active = ?", true).Count(&data.TotalReaders).Error; err != nil {
		return nil, err
	}

	// 6. Article Trend (Last 30 days)
	data.ArticleTrend = make([]domain.ArticleTrend, 0)
	rows, err := r.db.Raw(`
		SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
		FROM articles
		WHERE created_at >= NOW() - INTERVAL '30 days'
		GROUP BY date
		ORDER BY date ASC
	`).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var trend domain.ArticleTrend
		rows.Scan(&trend.Date, &trend.Count)
		data.ArticleTrend = append(data.ArticleTrend, trend)
	}

	// 7. Top Categories
	data.TopCategories = make([]domain.CategoryStats, 0)
	err = r.db.Table("categories").
		Select("categories.id, categories.name, count(articles.id) as article_count").
		Joins("LEFT JOIN articles ON articles.category_id = categories.id").
		Group("categories.id, categories.name").
		Order("article_count DESC").
		Limit(5).
		Scan(&data.TopCategories).Error
	if err != nil {
		return nil, err
	}

	// 8. Top Tags
	data.TopTags = make([]domain.TagStats, 0)
	err = r.db.Table("tags").
		Select("tags.id, tags.name, tags.slug, count(article_tags.article_id) as usage_count").
		Joins("LEFT JOIN article_tags ON article_tags.tag_id = tags.id").
		Group("tags.id, tags.name, tags.slug").
		Order("usage_count DESC").
		Limit(5).
		Scan(&data.TopTags).Error
	if err != nil {
		return nil, err
	}

	return &data, nil
}

func (r *dashboardRepository) GetAdvancedAnalytics() (*domain.AdvancedAnalyticsData, error) {
	data := domain.AdvancedAnalyticsData{
		WorkflowStats: make([]struct {
			Status  string  `json:"status"`
			AvgDays float64 `json:"avg_days"`
		}, 0),
	}

	// 1. SEO Stats
	if err := r.db.Table("seo_metadata").
		Select("COUNT(*) filter (where meta_description is null or meta_description = '') as missing_meta_description, COUNT(*) filter (where og_image is null or og_image = '') as missing_og_image, COUNT(*) as total_seo_records").
		Scan(&data.SEOStats).Error; err != nil {
		return nil, err
	}

	// 2. Workflow Stats
	data.WorkflowStats = make([]struct {
		Status  string  `json:"status"`
		AvgDays float64 `json:"avg_days"`
	}, 0)
	r.db.Raw(`
		SELECT status, COALESCE(AVG(diff_seconds) / 86400, 0) as avg_days
		FROM (
			SELECT 
				new_status as status,
				EXTRACT(EPOCH FROM (COALESCE(LEAD(created_at) OVER (PARTITION BY article_id ORDER BY created_at), NOW()) - created_at)) as diff_seconds
			FROM article_status_logs
		) sub
		GROUP BY status
	`).Scan(&data.WorkflowStats)

	// 3. Media Stats
	if err := r.db.Table("media_files").
		Select("COUNT(*) as total_files, COALESCE(SUM(file_size), 0) as total_size").
		Scan(&data.MediaStats).Error; err != nil {
		return nil, err
	}

	// 4. Versioning Stats
	var versionStats struct {
		Avg   float64
		Total int64
	}
	if err := r.db.Raw(`
		SELECT AVG(version_count) as avg, SUM(version_count) as total
		FROM (
			SELECT COUNT(*) as version_count
			FROM article_versions
			GROUP BY article_id
		) as v
	`).Scan(&versionStats).Error; err == nil {
		data.VersioningStats.AvgEditsPerArticle = versionStats.Avg
		data.VersioningStats.TotalVersions = versionStats.Total
	}

	// 5. Content Graph
	r.db.Table("article_relations").Count(&data.ContentGraph.TotalRelations)

	r.db.Raw(`
		SELECT COUNT(*) FROM articles 
		WHERE id NOT IN (SELECT article_id FROM article_relations) 
		AND id NOT IN (SELECT related_article_id FROM article_relations)
	`).Scan(&data.ContentGraph.OrphanPages)

	var totalArticles int64
	r.db.Model(&domain.Article{}).Count(&totalArticles)
	if totalArticles > 0 {
		data.ContentGraph.AvgLinksPerArticle = float64(data.ContentGraph.TotalRelations) / float64(totalArticles)
	}

	// 6. Content Health
	if totalArticles > 0 {
		var totalTagLinks int64
		r.db.Table("article_tags").Count(&totalTagLinks)
		data.ContentHealth.AvgTagDensity = float64(totalTagLinks) / float64(totalArticles)
	}

	r.db.Model(&domain.Article{}).
		Where("LENGTH(content) > 1000").
		Count(&data.ContentHealth.GoodContentLength)

	// Missing canonical URLs
	r.db.Table("seo_metadata").
		Where("canonical_url IS NULL OR canonical_url = ''").
		Count(&data.ContentHealth.MissingCanonical)

	return &data, nil
}

// GetCategoryHierarchyStats returns statistics about the category hierarchy
func (r *dashboardRepository) GetCategoryHierarchyStats() (*domain.CategoryHierarchyStats, error) {
	var stats domain.CategoryHierarchyStats

	if err := r.db.Model(&domain.Category{}).Where("parent_id IS NULL").Count(&stats.RootCount).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&domain.Category{}).Where("parent_id IS NOT NULL").Count(&stats.ChildCount).Error; err != nil {
		return nil, err
	}

	var avgResult struct {
		Avg float64
	}
	err := r.db.Raw(`
		SELECT AVG(child_count) as avg
		FROM (
			SELECT parent_id, COUNT(*) as child_count
			FROM categories
			WHERE parent_id IS NOT NULL
			GROUP BY parent_id
		) as parent_counts
	`).Scan(&avgResult).Error
	if err != nil {
		return nil, err
	}
	stats.AvgChildren = avgResult.Avg

	var maxDepthResult struct {
		MaxDepth int
	}
	err = r.db.Raw(`
		WITH RECURSIVE category_tree AS (
			SELECT id, parent_id, 0 as depth
			FROM categories
			WHERE parent_id IS NULL
			
			UNION ALL
			
			SELECT c.id, c.parent_id, ct.depth + 1
			FROM categories c
			INNER JOIN category_tree ct ON c.parent_id = ct.id
		)
		SELECT COALESCE(MAX(depth), 0) as max_depth
		FROM category_tree
	`).Scan(&maxDepthResult).Error
	if err != nil {
		return nil, err
	}
	stats.MaxDepth = maxDepthResult.MaxDepth

	return &stats, nil
}

// GetCategoryTree returns the full category tree with article counts
func (r *dashboardRepository) GetCategoryTree() ([]domain.CategoryNode, error) {
	var categories []struct {
		ID           string
		Name         string
		Slug         string
		ParentID     *string
		ArticleCount int64
	}

	err := r.db.Table("categories").
		Select("categories.id, categories.name, categories.slug, categories.parent_id, COUNT(articles.id) as article_count").
		Joins("LEFT JOIN articles ON articles.category_id = categories.id").
		Group("categories.id, categories.name, categories.slug, categories.parent_id").
		Order("categories.name ASC").
		Scan(&categories).Error
	if err != nil {
		return nil, err
	}

	nodeMap := make(map[string]*domain.CategoryNode)

	for _, cat := range categories {
		id, _ := uuid.Parse(cat.ID)
		node := &domain.CategoryNode{
			ID:           id,
			Name:         cat.Name,
			Slug:         cat.Slug,
			ArticleCount: cat.ArticleCount,
			Children:     []domain.CategoryNode{},
		}
		nodeMap[cat.ID] = node
	}

	var rootNodes []*domain.CategoryNode
	for _, cat := range categories {
		node := nodeMap[cat.ID]
		if cat.ParentID == nil {
			node.Level = 0
			rootNodes = append(rootNodes, node)
		} else {
			if parent, exists := nodeMap[*cat.ParentID]; exists {
				node.Level = parent.Level + 1
				parent.Children = append(parent.Children, *node)
			}
		}
	}

	var buildCompleteTree func(node *domain.CategoryNode) domain.CategoryNode
	buildCompleteTree = func(node *domain.CategoryNode) domain.CategoryNode {
		result := domain.CategoryNode{
			ID:           node.ID,
			Name:         node.Name,
			Slug:         node.Slug,
			Level:        node.Level,
			ArticleCount: node.ArticleCount,
			Children:     []domain.CategoryNode{},
		}

		for _, childValue := range node.Children {
			childID := childValue.ID.String()
			if childPtr, exists := nodeMap[childID]; exists {
				completeChild := buildCompleteTree(childPtr)
				result.Children = append(result.Children, completeChild)
			}
		}

		return result
	}

	result := make([]domain.CategoryNode, 0, len(rootNodes))
	for _, rootPtr := range rootNodes {
		completeRoot := buildCompleteTree(rootPtr)
		result = append(result, completeRoot)
	}

	return result, nil
}

func (r *dashboardRepository) GetSuperDashboard() (*domain.SuperDashboardData, error) {
	var data domain.SuperDashboardData

	// 1. Stats
	analytics, err := r.GetAnalytics()
	if err != nil {
		return nil, err
	}
	data.Stats = *analytics

	// 2. Advanced
	advanced, err := r.GetAdvancedAnalytics()
	if err != nil {
		return nil, err
	}
	data.Advanced = *advanced

	// 3. Category Hierarchy
	hierarchy, err := r.GetCategoryHierarchyStats()
	if err != nil {
		return nil, err
	}
	data.CategoryHierarchy = *hierarchy

	// 4. Category Tree
	tree, err := r.GetCategoryTree()
	if err != nil {
		return nil, err
	}
	data.CategoryTree = tree

	// 5. Engagement
	r.db.Table("comments").Count(&data.Engagement.TotalComments)
	r.db.Table("comments").Where("is_spam = ?", true).Count(&data.Engagement.SpamComments)
	r.db.Table("comments").Where("is_deleted = ?", true).Count(&data.Engagement.DeletedComments)
	r.db.Table("article_stats").Select("COALESCE(SUM(share_count), 0)").Scan(&data.Engagement.TotalShares)
	r.db.Model(&domain.Article{}).Where("is_featured = ?", true).Count(&data.Engagement.FeaturedCount)

	// 6. System
	data.System.RecentAuditLogs = make([]domain.AuditLog, 0)
	r.db.Table("audit_logs").Order("created_at DESC").Limit(10).Scan(&data.System.RecentAuditLogs)
	r.db.Table("audit_logs").Count(&data.System.TotalLogs)

	// 7. User Stats
	r.db.Model(&domain.User{}).Count(&data.UserStats.TotalUsers)
	r.db.Model(&domain.User{}).Where("is_active = ?", true).Count(&data.UserStats.ActiveUsers)
	r.db.Model(&domain.User{}).Where("is_active = ?", false).Count(&data.UserStats.InactiveUsers)

	// Get role distribution for user stats
	roleCounts := make([]domain.RoleCount, 0)
	r.db.Table("roles").
		Select("roles.name as role_name, count(user_roles.user_id) as count").
		Joins("LEFT JOIN user_roles ON user_roles.role_id = roles.id").
		Group("roles.name").
		Scan(&roleCounts)
	data.UserStats.RoleDistribution = roleCounts

	// 8. System Pulse (Runtime Stats)
	sqlDB, _ := r.db.DB()
	data.Pulse.DBConnections = sqlDB.Stats().OpenConnections
	var uptimeResult struct {
		Seconds int64
	}
	r.db.Raw("SELECT CAST(EXTRACT(EPOCH FROM (NOW() - Pg_postmaster_start_time())) AS BIGINT) as seconds").Scan(&uptimeResult)
	data.Pulse.UptimeSeconds = uptimeResult.Seconds

	// 9. Activity Heatmap (Audit Logs)
	data.Heatmap = make([]domain.ActivityHeatmap, 0)
	rows, err := r.db.Raw(`
		SELECT 
			TRIM(TO_CHAR(created_at, 'Day')) as day_name,
			EXTRACT(HOUR FROM created_at) as hour_num,
			COUNT(*) as hits
		FROM audit_logs
		WHERE created_at >= NOW() - INTERVAL '7 days'
		GROUP BY day_name, hour_num
		ORDER BY day_name, hour_num
	`).Rows()
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var h domain.ActivityHeatmap
			rows.Scan(&h.Day, &h.Hour, &h.Hits)
			data.Heatmap = append(data.Heatmap, h)
		}
	}

	// 10. Editorial Velocity
	var velocity domain.EditorialSpeed
	r.db.Raw(`
		SELECT 
			COUNT(*) as total_published,
			COALESCE(AVG(EXTRACT(EPOCH FROM (l.created_at - a.created_at))/86400), 0) as avg_days
		FROM article_status_logs l
		JOIN articles a ON l.article_id = a.id
		WHERE l.new_status = 'published'
	`).Scan(&struct {
		TotalPublished *int64
		AvgDays        *float64
	}{
		TotalPublished: &velocity.TotalPublished,
		AvgDays:        &velocity.DraftToPublishDays,
	})
	data.Velocity = velocity

	return &data, nil
}
