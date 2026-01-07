package repository

import (
	"backend/internal/domain"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type articleRepository struct {
	db *gorm.DB
}

func NewArticleRepository(db *gorm.DB) domain.ArticleRepository {
	return &articleRepository{db: db}
}

func (r *articleRepository) Create(article *domain.Article) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(article).Error; err != nil {
			return err
		}
		// Associate Tags
		if len(article.Tags) > 0 {
			if err := tx.Model(article).Association("Tags").Replace(article.Tags); err != nil {
				return err
			}
		}
		// Associate Related
		if len(article.Related) > 0 {
			if err := tx.Model(article).Association("Related").Replace(article.Related); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *articleRepository) GetAll(offset, limit int, filter map[string]interface{}) ([]domain.Article, int64, error) {
	var articles []domain.Article
	var total int64

	query := r.db.Model(&domain.Article{})
	minimal := false
	if m, ok := filter["minimal"]; ok {
		minimal = m.(bool)
	}

	if minimal {
		query = query.Select("id", "title", "slug")
	} else {
		query = query.
			Preload("Category").
			Preload("Author").
			Preload("Tags").
			Preload("Images").
			Preload("Related").
			Preload("MediaList.Media") // Preload ArticleMedia and the internal MediaFile
	}

	if status, ok := filter["status"]; ok && status != "" {
		query = query.Where("articles.status = ?", status)
	}

	if categoryID, ok := filter["category_id"]; ok && categoryID != "" {
		query = query.Where("articles.category_id = ?", categoryID)
	}

	if search, ok := filter["search"]; ok && search != "" {
		searchTerm := "%" + search.(string) + "%"
		if minimal {
			query = query.Where("(title ILIKE ? OR slug ILIKE ?)", searchTerm, searchTerm)
		} else {
			query = query.
				Joins("LEFT JOIN categories ON categories.id = articles.category_id").
				Joins("LEFT JOIN users ON users.id = articles.author_id").
				Where("(articles.title ILIKE ? OR articles.slug ILIKE ? OR articles.summary ILIKE ? OR categories.name ILIKE ? OR users.full_name ILIKE ? OR articles.status ILIKE ?)",
					searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Offset(offset).Limit(limit).Order("articles.created_at DESC").Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

func (r *articleRepository) GetByID(id uuid.UUID) (*domain.Article, error) {
	var article domain.Article
	err := r.db.Preload("Category").
		Preload("Author").
		Preload("Tags").
		Preload("Images").
		Preload("MediaList.Media").
		Preload("SEOMetadata").
		Preload("Related").
		Preload("Versions").
		Preload("StatusLogs").
		First(&article, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &article, nil
}

func (r *articleRepository) GetBySlug(slug string) (*domain.Article, error) {
	var article domain.Article
	err := r.db.Preload("Category").
		Preload("Author").
		Preload("Tags").
		Preload("Images").
		Preload("MediaList.Media").
		Preload("SEOMetadata").
		Preload("Related").
		Preload("Versions").
		Preload("StatusLogs").
		First(&article, "slug = ?", slug).Error
	if err != nil {
		return nil, err
	}
	return &article, nil
}

func (r *articleRepository) Update(article *domain.Article) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(article).Select("Title", "Slug", "Summary", "Content", "CategoryID", "Status", "IsFeatured", "AllowComment", "PublishedAt", "UpdatedAt", "ViewCount").
			Updates(article).Error; err != nil {
			return err
		}

		if err := tx.Model(article).Association("Tags").Replace(article.Tags); err != nil {
			return err
		}

		if err := tx.Model(article).Association("MediaList").Replace(article.MediaList); err != nil {
			return err
		}

		// Handle Images association for article_images table
		if err := tx.Model(article).Association("Images").Replace(article.Images); err != nil {
			return err
		}

		// Handle Related articles association
		if err := tx.Model(article).Association("Related").Replace(article.Related); err != nil {
			return err
		}

		if len(article.Versions) > 0 {
			for _, v := range article.Versions {
				if v.ID == uuid.Nil {
					v.ArticleID = article.ID
					if err := tx.Create(&v).Error; err != nil {
						return err
					}
				}
			}
		}

		if len(article.StatusLogs) > 0 {
			for _, l := range article.StatusLogs {
				if l.ID == uuid.Nil {
					l.ArticleID = article.ID
					if err := tx.Create(&l).Error; err != nil {
						return err
					}
				}
			}
		}

		// Update SEO if exists
		if article.SEOMetadata != nil {
			var existingSEO domain.SeoMetadata
			if err := tx.Where("article_id = ?", article.ID).First(&existingSEO).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					article.SEOMetadata.ArticleID = article.ID
					if err := tx.Create(article.SEOMetadata).Error; err != nil {
						return err
					}
				} else {
					return err
				}
			} else {
				// Update existing
				article.SEOMetadata.ID = existingSEO.ID
				if err := tx.Model(&existingSEO).Updates(article.SEOMetadata).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (r *articleRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Article{}, "id = ?", id).Error
}

func (r *articleRepository) AddTags(articleID uuid.UUID, tagIDs []uuid.UUID) error {
	tags := make([]domain.Tag, len(tagIDs))
	for i, id := range tagIDs {
		tags[i] = domain.Tag{ID: id}
	}
	return r.db.Model(&domain.Article{ID: articleID}).Association("Tags").Append(tags)
}

func (r *articleRepository) UpdateStatus(id uuid.UUID, status domain.ArticleStatus) error {
	return r.db.Model(&domain.Article{}).Where("id = ?", id).Update("status", status).Error
}
