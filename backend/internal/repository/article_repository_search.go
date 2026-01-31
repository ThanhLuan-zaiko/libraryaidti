package repository

import (
	"backend/internal/domain"
	"errors"
)

// SearchArticles implements full-text search with PostgreSQL FTS and pg_trgm fuzzy matching
func (r *articleRepository) SearchArticles(query string, offset, limit int, filters map[string]interface{}) ([]domain.Article, int64, error) {
	var articles []domain.Article
	var total int64

	if query == "" {
		return articles, 0, errors.New("search query is required")
	}

	// Apply status filter (default to PUBLISHED for public search)
	status := "PUBLISHED"
	if s, ok := filters["status"]; ok && s != "" {
		status = s.(string)
	}

	// Apply category filter
	categoryFilter := ""
	if categoryID, ok := filters["category_id"]; ok && categoryID != "" {
		categoryFilter = categoryID.(string)
	}

	// Count total distinct articles matching the search
	countQuery := r.db.Model(&domain.Article{}).
		Joins("LEFT JOIN categories ON categories.id = articles.category_id").
		Joins("LEFT JOIN article_tags ON article_tags.article_id = articles.id").
		Joins("LEFT JOIN tags ON tags.id = article_tags.tag_id").
		Where("articles.status = ?", status).
		Where(`
			(
				articles.search_vector @@ websearch_to_tsquery('simple', ?) OR
				similarity(articles.title, ?) > 0.3 OR
				articles.title ILIKE ? OR
				categories.name ILIKE ? OR
				tags.name ILIKE ?
			)
		`, query, query, "%"+query+"%", "%"+query+"%", "%"+query+"%")

	if categoryFilter != "" {
		countQuery = countQuery.Where("articles.category_id = ?", categoryFilter)
	}

	// Use distinct count on article id
	if err := countQuery.Distinct("articles.id").Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Main search query with ranking
	// Using subquery approach to avoid DISTINCT ON ordering issues
	searchQuery := `
		SELECT DISTINCT ON (sub.id) sub.* FROM (
			SELECT 
				articles.*,
				(
					ts_rank(articles.search_vector, websearch_to_tsquery('simple', ?)) * 2.0 +
					similarity(articles.title, ?) * 3.0 +
					CASE WHEN articles.is_featured THEN 0.5 ELSE 0 END +
					(articles.view_count::float / 1000.0) * 0.1
				) AS search_rank
			FROM articles
			LEFT JOIN categories ON categories.id = articles.category_id
			LEFT JOIN article_tags ON article_tags.article_id = articles.id
			LEFT JOIN tags ON tags.id = article_tags.tag_id
			WHERE articles.status = ?
				AND (
					articles.search_vector @@ websearch_to_tsquery('simple', ?) OR
					similarity(articles.title, ?) > 0.3 OR
					articles.title ILIKE ? OR
					categories.name ILIKE ? OR
					tags.name ILIKE ?
				)
	`

	// Add category filter if specified
	args := []interface{}{query, query, status, query, query, "%" + query + "%", "%" + query + "%", "%" + query + "%"}
	if categoryFilter != "" {
		searchQuery += " AND articles.category_id = ?"
		args = append(args, categoryFilter)
	}

	// Close subquery and add ordering
	searchQuery += `
			ORDER BY search_rank DESC, articles.created_at DESC
		) sub
		ORDER BY sub.id, sub.search_rank DESC
	`

	// Final ordering wrapper
	finalQuery := "SELECT * FROM (" + searchQuery + ") final ORDER BY search_rank DESC, created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	// Execute raw query
	if err := r.db.Raw(finalQuery, args...).Scan(&articles).Error; err != nil {
		return nil, 0, err
	}

	// Load associations manually since we used raw query
	for i := range articles {
		r.db.Model(&articles[i]).Association("Category").Find(&articles[i].Category)
		r.db.Model(&articles[i]).Association("Author").Find(&articles[i].Author)
		r.db.Model(&articles[i]).Association("Tags").Find(&articles[i].Tags)
		r.db.Model(&articles[i]).Association("Images").Find(&articles[i].Images)
		articles[i].PopulateImageURL()
	}

	return articles, total, nil
}
