package repository

import (
	"backend/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type tagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) domain.TagRepository {
	return &tagRepository{db: db}
}

func (r *tagRepository) Create(tag *domain.Tag) error {
	return r.db.Create(tag).Error
}

func (r *tagRepository) GetAll() ([]domain.Tag, error) {
	var tags []domain.Tag
	err := r.db.Find(&tags).Error
	return tags, err
}

func (r *tagRepository) GetByID(id uuid.UUID) (*domain.Tag, error) {
	var tag domain.Tag
	err := r.db.First(&tag, "id = ?", id).Error
	return &tag, err
}

func (r *tagRepository) GetBySlug(slug string) (*domain.Tag, error) {
	var tag domain.Tag
	err := r.db.First(&tag, "slug = ?", slug).Error
	return &tag, err
}

func (r *tagRepository) GetList(page, limit int, search, sortBy, order string) (*domain.PaginatedResult[domain.Tag], error) {
	var tags []domain.Tag
	var totalRows int64

	query := r.db.Model(&domain.Tag{})

	if search != "" {
		query = query.Where("name ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	err := query.Count(&totalRows).Error
	if err != nil {
		return nil, err
	}

	totalPages := int(totalRows) / limit
	if int(totalRows)%limit != 0 {
		totalPages++
	}

	offset := (page - 1) * limit

	sortString := "name ASC" // Default for tags
	if sortBy != "" {
		sortDirection := "ASC"
		if order == "desc" || order == "DESC" {
			sortDirection = "DESC"
		}
		switch sortBy {
		case "name":
			sortString = "name " + sortDirection
		case "slug":
			sortString = "slug " + sortDirection
		}
	}

	err = query.Limit(limit).Offset(offset).Order(sortString).Find(&tags).Error
	if err != nil {
		return nil, err
	}

	return &domain.PaginatedResult[domain.Tag]{
		Data: tags,
		Pagination: domain.Pagination{
			Page:       page,
			Limit:      limit,
			TotalRows:  totalRows,
			TotalPages: totalPages,
		},
	}, nil
}

func (r *tagRepository) GetStats() ([]domain.TagStats, error) {
	var stats []domain.TagStats
	// Count usage in article_tags
	err := r.db.Table("tags").
		Select("tags.id, tags.name, tags.slug, count(article_tags.article_id) as usage_count").
		Joins("LEFT JOIN article_tags ON article_tags.tag_id = tags.id").
		Group("tags.id, tags.name, tags.slug").
		Order("usage_count DESC").
		Limit(20). // Top 20 tags
		Scan(&stats).Error
	return stats, err
}

func (r *tagRepository) Update(tag *domain.Tag) error {
	return r.db.Save(tag).Error
}

func (r *tagRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Tag{}, "id = ?", id).Error
}
