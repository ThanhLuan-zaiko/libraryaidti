package repository

import (
	"backend/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) domain.CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(category *domain.Category) error {
	return r.db.Create(category).Error
}

func (r *categoryRepository) GetAll() ([]domain.Category, error) {
	var categories []domain.Category
	// Preload to get hierarchy if needed
	err := r.db.Preload("Parent").Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) GetByID(id uuid.UUID) (*domain.Category, error) {
	var category domain.Category
	if err := r.db.Preload("Parent").Preload("Children").First(&category, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) GetBySlug(slug string) (*domain.Category, error) {
	var category domain.Category
	if err := r.db.Preload("Parent").Preload("Children").First(&category, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) GetStats() ([]domain.CategoryStats, error) {
	var stats []domain.CategoryStats
	// Count articles per category
	err := r.db.Table("categories").
		Select("categories.id, categories.name, count(articles.id) as article_count").
		Joins("LEFT JOIN articles ON articles.category_id = categories.id").
		Group("categories.id, categories.name").
		Order("article_count DESC").
		Scan(&stats).Error
	return stats, err
}

func (r *categoryRepository) GetList(page, limit int, search, sortBy, order string, minimal bool) (*domain.PaginatedResult[domain.Category], error) {
	var categories []domain.Category
	var totalRows int64

	query := r.db.Model(&domain.Category{})

	if search != "" {
		query = query.Where("name ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Count total rows
	if err := query.Count(&totalRows).Error; err != nil {
		return nil, err
	}

	totalPages := int(totalRows) / limit
	if int(totalRows)%limit != 0 {
		totalPages++
	}

	offset := (page - 1) * limit

	sortString := "created_at DESC"
	if sortBy != "" {
		sortDirection := "ASC"
		if order == "desc" || order == "DESC" {
			sortDirection = "DESC"
		}
		switch sortBy {
		case "name":
			sortString = "name " + sortDirection
		case "created_at":
			sortString = "created_at " + sortDirection
		case "is_active":
			sortString = "is_active " + sortDirection
		}
	}

	// Get paginated categories
	q := query.Offset(offset).Limit(limit).Order(sortString)
	if minimal {
		q = q.Select("id", "name", "slug", "parent_id")
	} else {
		q = q.Preload("Parent")
	}

	err := q.Find(&categories).Error
	if err != nil {
		return nil, err
	}

	if !minimal {
		// Build full tree for each category only if not minimal
		for i := range categories {
			r.loadChildren(&categories[i])
		}
	}

	return &domain.PaginatedResult[domain.Category]{
		Data: categories,
		Pagination: domain.Pagination{
			Page:       page,
			Limit:      limit,
			TotalRows:  totalRows,
			TotalPages: totalPages,
		},
	}, nil
}

// loadChildren recursively loads all children for a category
func (r *categoryRepository) loadChildren(category *domain.Category) {
	var children []domain.Category

	err := r.db.Where("parent_id = ?", category.ID).
		Preload("Parent").
		Find(&children).Error

	if err != nil || len(children) == 0 {
		category.Children = []domain.Category{}
		return
	}

	// Recursively load children for each child
	for i := range children {
		r.loadChildren(&children[i])
	}

	category.Children = children
}

func (r *categoryRepository) Update(category *domain.Category) error {
	return r.db.Save(category).Error
}

func (r *categoryRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.Category{}, "id = ?", id).Error
}
