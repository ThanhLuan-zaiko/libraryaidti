package service

import (
	"backend/internal/domain"
	"fmt"
)

// SearchArticles implements article search with singleflight for deduplication
func (s *articleService) SearchArticles(query string, page, limit int, filters map[string]interface{}) ([]domain.Article, int64, error) {
	// Validation
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	// Limit max results for performance
	if limit > 50 {
		limit = 50
	}

	offset := (page - 1) * limit

	// Use singleflight to prevent duplicate concurrent searches
	key := fmt.Sprintf("search_%s_%d_%d_%v", query, page, limit, filters)
	v, err, _ := s.sfGroup.Do(key, func() (interface{}, error) {
		articles, total, err := s.repo.SearchArticles(query, offset, limit, filters)
		if err != nil {
			return nil, err
		}

		// Return as a struct to preserve both values through singleflight
		return struct {
			articles []domain.Article
			total    int64
		}{articles, total}, nil
	})

	if err != nil {
		return nil, 0, err
	}

	// Extract result
	result := v.(struct {
		articles []domain.Article
		total    int64
	})

	return result.articles, result.total, nil
}
