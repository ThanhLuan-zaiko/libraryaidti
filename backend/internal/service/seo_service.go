package service

import (
	"backend/internal/domain"
	"errors"

	"github.com/google/uuid"
)

type seoService struct {
	repo domain.SeoRepository
}

func NewSeoService(repo domain.SeoRepository) domain.SeoService {
	return &seoService{repo: repo}
}

// Global Redirects

func (s *seoService) CreateRedirect(fromSlug, toSlug string) error {
	// Check if exists
	existing, _ := s.repo.GetRedirectByFromSlug(fromSlug)
	if existing != nil {
		return errors.New("đường dẫn chuyển hướng đã tồn tại cho slug này")
	}

	redirect := &domain.SeoRedirect{
		FromSlug: fromSlug,
		ToSlug:   toSlug,
	}
	return s.repo.CreateRedirect(redirect)
}

func (s *seoService) GetAllRedirects(page, limit int, search string) ([]domain.SeoRedirect, int64, error) {
	return s.repo.GetAllRedirects(page, limit, search)
}

func (s *seoService) UpdateRedirect(id uuid.UUID, fromSlug, toSlug string) error {

	existing, _ := s.repo.GetRedirectByFromSlug(fromSlug)
	if existing != nil && existing.ID != id {
		return errors.New("đường dẫn chuyển hướng đã được sử dụng bởi quy tắc khác")
	}

	redirect := &domain.SeoRedirect{
		ID:       id,
		FromSlug: fromSlug,
		ToSlug:   toSlug,
	}
	return s.repo.UpdateRedirect(redirect)
}

func (s *seoService) DeleteRedirect(id uuid.UUID) error {
	return s.repo.DeleteRedirect(id)
}

func (s *seoService) GetDestination(slug string) (string, error) {
	// Check global redirect first
	if redirect, err := s.repo.GetRedirectByFromSlug(slug); err == nil {
		return redirect.ToSlug, nil
	}

	// Check article redirect
	if articleRedirect, err := s.repo.GetArticleRedirectByFromSlug(slug); err == nil {
		return articleRedirect.ToSlug, nil
	}

	return "", nil
}

// Article Redirects

func (s *seoService) CreateArticleRedirect(articleID uuid.UUID, fromSlug, toSlug string) error {
	// Check if exists
	existing, _ := s.repo.GetArticleRedirectByFromSlug(fromSlug)
	if existing != nil {
		return errors.New("đường dẫn chuyển hướng bài viết đã tồn tại cho slug này")
	}

	redirect := &domain.ArticleSeoRedirect{
		ArticleID: articleID,
		FromSlug:  fromSlug,
		ToSlug:    toSlug,
	}
	return s.repo.CreateArticleRedirect(redirect)
}

func (s *seoService) GetAllArticleRedirects(page, limit int, search string) ([]domain.ArticleSeoRedirect, int64, error) {
	return s.repo.GetAllArticleRedirects(page, limit, search)
}

func (s *seoService) DeleteArticleRedirect(id uuid.UUID) error {
	return s.repo.DeleteArticleRedirect(id)
}

func (s *seoService) GetSeoTrends(months int) ([]domain.SeoTrendData, error) {
	return s.repo.GetSeoTrends(months)
}
