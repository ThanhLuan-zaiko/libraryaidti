package service

import (
	"backend/internal/domain"
	"backend/internal/utils"
	"strings"

	"github.com/google/uuid"
)

type categoryService struct {
	repo domain.CategoryRepository
}

func NewCategoryService(repo domain.CategoryRepository) domain.CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) CreateCategory(category *domain.Category) error {
	if category.Slug == "" {
		category.Slug = utils.GenerateSlug(category.Name)
	}
	category.Slug = strings.ToLower(category.Slug)
	return s.repo.Create(category)
}

func (s *categoryService) GetCategories() ([]domain.Category, error) {
	return s.repo.GetAll()
}

func (s *categoryService) GetCategoryByID(id uuid.UUID) (*domain.Category, error) {
	return s.repo.GetByID(id)
}

func (s *categoryService) GetCategoryBySlug(slug string) (*domain.Category, error) {
	return s.repo.GetBySlug(slug)
}

func (s *categoryService) GetCategoryStats() ([]domain.CategoryStats, error) {
	return s.repo.GetStats()
}

func (s *categoryService) GetCategoryList(page, limit int, search, sortBy, order string) (*domain.PaginatedResult[domain.Category], error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	return s.repo.GetList(page, limit, search, sortBy, order)
}

func (s *categoryService) UpdateCategory(category *domain.Category) error {
	// Always sync slug with name on update to satisfy requirement
	if category.Name != "" {
		category.Slug = utils.GenerateSlug(category.Name)
	}
	category.Slug = strings.ToLower(category.Slug)
	return s.repo.Update(category)
}

func (s *categoryService) DeleteCategory(id uuid.UUID) error {
	return s.repo.Delete(id)
}
