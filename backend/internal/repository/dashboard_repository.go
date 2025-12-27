package repository

import (
	"backend/internal/domain"

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

	// 3. Total Comments (Combine table if needed, or stick to comments table)
	if err := r.db.Model(&domain.Comment{}).Count(&data.TotalComments).Error; err != nil {
		return nil, err
	}

	// 4. Article Trend (Last 7 days)
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

	// Fill missing dates if needed (skipped for simplicity, handled in frontend or basic query)

	// 5. Top Categories (Reuse existing logic or improved query)
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

	// 6. Top Tags
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
