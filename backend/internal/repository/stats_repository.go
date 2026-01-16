package repository

import (
	"backend/internal/domain"
	"fmt"

	"gorm.io/gorm"
)

type statsRepository struct {
	db *gorm.DB
}

func NewStatsRepository(db *gorm.DB) domain.StatsRepository {
	return &statsRepository{db: db}
}

func (r *statsRepository) GetAdminStats() (*domain.AdminStats, error) {
	var stats domain.AdminStats

	// Count articles
	err := r.db.Model(&domain.Article{}).Count(&stats.TotalArticles).Error
	if err != nil {
		return nil, err
	}

	// Count readers (users with SUBSCRIBER role)
	err = r.db.Table("users").
		Joins("JOIN user_roles ON user_roles.user_id = users.id").
		Joins("JOIN roles ON roles.id = user_roles.role_id").
		Where("roles.name = ?", "SUBSCRIBER").
		Count(&stats.TotalReaders).Error
	if err != nil {
		return nil, err
	}

	// Count categories
	err = r.db.Model(&domain.Category{}).Count(&stats.TotalCategories).Error
	if err != nil {
		return nil, err
	}

	// Count pending posts (Review status)
	err = r.db.Model(&domain.Article{}).Where("status = ?", "REVIEW").Count(&stats.PendingPosts).Error
	if err != nil {
		return nil, err
	}

	// Count draft posts
	err = r.db.Model(&domain.Article{}).Where("status = ?", "DRAFT").Count(&stats.DraftPosts).Error
	if err != nil {
		return nil, err
	}

	// Calculate Article Trend (Last 7 days vs Previous 7 days)
	var currArticles, prevArticles int64
	r.db.Model(&domain.Article{}).Where("created_at >= NOW() - INTERVAL '7 days'").Count(&currArticles)
	r.db.Model(&domain.Article{}).Where("created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'").Count(&prevArticles)

	if prevArticles > 0 {
		stats.ArticleTrend = float64(currArticles-prevArticles) / float64(prevArticles) * 100.0
	} else if currArticles > 0 {
		stats.ArticleTrend = 100.0
	}

	// Calculate Reader Trend (Last 7 days vs Previous 7 days)
	var currReaders, prevReaders int64

	r.db.Table("users").
		Joins("JOIN user_roles ON user_roles.user_id = users.id").
		Joins("JOIN roles ON roles.id = user_roles.role_id").
		Where("roles.name = ?", "SUBSCRIBER").
		Where("users.created_at >= NOW() - INTERVAL '7 days'").
		Count(&currReaders)

	r.db.Table("users").
		Joins("JOIN user_roles ON user_roles.user_id = users.id").
		Joins("JOIN roles ON roles.id = user_roles.role_id").
		Where("roles.name = ?", "SUBSCRIBER").
		Where("users.created_at >= NOW() - INTERVAL '14 days' AND users.created_at < NOW() - INTERVAL '7 days'").
		Count(&prevReaders)

	if prevReaders > 0 {
		stats.ReaderTrend = float64(currReaders-prevReaders) / float64(prevReaders) * 100.0
	} else if currReaders > 0 {
		stats.ReaderTrend = 100.0
	}

	return &stats, nil
}

func (r *statsRepository) GetRecentActivities(limit int) ([]domain.AdminActivity, error) {
	var activities []domain.AdminActivity

	// Fetch recent articles
	var articles []domain.Article
	err := r.db.Preload("Author").Order("updated_at desc").Limit(limit).Find(&articles).Error
	if err != nil {
		return nil, err
	}

	for _, article := range articles {
		typeStr := "article_updated"
		content := fmt.Sprintf("Bài viết \"%s\" đã được cập nhật", article.Title)
		if article.Status == domain.StatusPublished {
			typeStr = "article_published"
			content = fmt.Sprintf("Bài viết \"%s\" đã được xuất bản", article.Title)
		}

		userName := "Hệ thống"
		if article.Author.FullName != "" {
			userName = article.Author.FullName
		}

		activities = append(activities, domain.AdminActivity{
			ID:        article.ID.String(),
			Type:      typeStr,
			Content:   content,
			Timestamp: article.UpdatedAt,
			User:      userName,
		})
	}

	// Fetch recent users
	var users []domain.User
	err = r.db.Order("created_at desc").Limit(limit).Find(&users).Error
	if err == nil {
		for _, user := range users {
			activities = append(activities, domain.AdminActivity{
				ID:        user.ID.String(),
				Type:      "user_registered",
				Content:   fmt.Sprintf("Người dùng mới \"%s\" đã đăng ký", user.FullName),
				Timestamp: user.CreatedAt,
				User:      user.FullName,
			})
		}
	}

	return activities, nil
}

func (r *statsRepository) GetAnalytics(days int) ([]domain.AnalyticsData, error) {
	analytics := []domain.AnalyticsData{}

	// Improved query to handle dates with 0 values and actual views from article_views
	err := r.db.Raw(`
		WITH date_series AS (
			SELECT CAST(CURRENT_DATE - (i || ' day')::interval AS DATE) as d
			FROM generate_series(0, ?) i
		)
		SELECT 
			TO_CHAR(ds.d, 'DD/MM') as date,
			COALESCE(a.count, 0) as articles,
			COALESCE(v.count, 0) as views
		FROM date_series ds
		LEFT JOIN (
			SELECT CAST(created_at AS DATE) as d, COUNT(*) as count
			FROM articles
			GROUP BY d
		) a ON ds.d = a.d
		LEFT JOIN (
			SELECT CAST(viewed_at AS DATE) as d, COUNT(*) as count
			FROM article_views
			WHERE session_duration >= 30
			GROUP BY d
		) v ON ds.d = v.d
		ORDER BY ds.d ASC
	`, days-1).Scan(&analytics).Error

	return analytics, err
}

func (r *statsRepository) GetCategoryDistribution() ([]domain.CategoryDistribution, error) {
	distribution := []domain.CategoryDistribution{}

	err := r.db.Table("categories").
		Select("categories.name, count(articles.id) as value").
		Joins("LEFT JOIN articles ON articles.category_id = categories.id").
		Group("categories.name").
		Scan(&distribution).Error

	return distribution, err
}
