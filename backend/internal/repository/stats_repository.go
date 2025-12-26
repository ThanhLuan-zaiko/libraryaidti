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
	// Joining users with roles via user_roles
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

	// Mock trends for now or implement logic if needed
	stats.ArticleTrend = 12.0
	stats.ReaderTrend = 5.4

	return &stats, nil
}

func (r *statsRepository) GetRecentActivities(limit int) ([]domain.AdminActivity, error) {
	var activities []domain.AdminActivity

	// Fetch recent articles as "published" or "updated" activities
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

	// Sort activities by timestamp desc and limit
	// (A simple sort for now)
	return activities, nil
}
func (r *statsRepository) GetAnalytics(days int) ([]domain.AnalyticsData, error) {
	analytics := []domain.AnalyticsData{}

	err := r.db.Raw(`
		SELECT TO_CHAR(created_at, 'DD/MM') as date, COUNT(*) as articles, 0 as views
		FROM articles
		WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * ?
		GROUP BY date
		ORDER BY MIN(created_at)
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
