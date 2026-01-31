package handler

import (
	apperrors "backend/internal/core/error"
	"backend/internal/core/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

// SearchArticles handles article search requests
// GET /api/v1/articles/search?q=keyword&page=1&limit=10&category_id=uuid&status=PUBLISHED
func (h *ArticleHandler) SearchArticles(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.Error(c, apperrors.NewBadRequest("Search query (q) is required"))
		return
	}

	// Validate query length to prevent abuse
	if len(query) > 200 {
		response.Error(c, apperrors.NewBadRequest("Search query too long (max 200 characters)"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	// Protection from excessive limits
	if limit > 50 {
		limit = 50
	}
	if limit < 1 {
		limit = 1
	}
	if page < 1 {
		page = 1
	}

	// Build filters
	filters := make(map[string]interface{})

	// Status filter - default to PUBLISHED for public search
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	} else {
		filters["status"] = "PUBLISHED"
	}

	// Category filter
	if categoryID := c.Query("category_id"); categoryID != "" {
		filters["category_id"] = categoryID
	}

	// Execute search
	articles, total, err := h.service.SearchArticles(query, page, limit, filters)
	if err != nil {
		c.Error(apperrors.NewInternalError(err))
		return
	}

	// Return results with metadata
	response.SuccessWithMeta(c, articles, gin.H{
		"total": total,
		"page":  page,
		"limit": limit,
		"query": query,
	})
}
