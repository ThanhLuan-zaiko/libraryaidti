package service

import (
	"backend/internal/domain"
	"backend/internal/utils"
	"strings"

	"github.com/google/uuid"
)

type tagService struct {
	repo domain.TagRepository
}

func NewTagService(repo domain.TagRepository) domain.TagService {
	return &tagService{repo: repo}
}

func (s *tagService) CreateTag(tag *domain.Tag) error {
	if tag.Slug == "" {
		tag.Slug = utils.GenerateSlug(tag.Name)
	}
	tag.Slug = strings.ToLower(tag.Slug)
	return s.repo.Create(tag)
}

func (s *tagService) GetTags() ([]domain.Tag, error) {
	return s.repo.GetAll()
}

func (s *tagService) GetTagByID(id uuid.UUID) (*domain.Tag, error) {
	return s.repo.GetByID(id)
}

func (s *tagService) GetTagBySlug(slug string) (*domain.Tag, error) {
	return s.repo.GetBySlug(slug)
}

func (s *tagService) GetTagList(page, limit int, search, sortBy, order string) (*domain.PaginatedResult[domain.Tag], error) {
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

func (s *tagService) GetTagStats() ([]domain.TagStats, error) {
	return s.repo.GetStats()
}

func (s *tagService) UpdateTag(tag *domain.Tag) error {
	// Always sync slug with name on update to satisfy requirement
	if tag.Name != "" {
		tag.Slug = utils.GenerateSlug(tag.Name)
	}
	tag.Slug = strings.ToLower(tag.Slug)
	return s.repo.Update(tag)
}

func (s *tagService) DeleteTag(id uuid.UUID) error {
	return s.repo.Delete(id)
}
