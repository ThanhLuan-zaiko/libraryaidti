package handler

import (
	apperrors "backend/internal/core/error"
	"backend/internal/core/response"
	"backend/internal/domain"
	"backend/internal/logger"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ViewTrackingHandler struct {
	service domain.ViewTrackingService
}

// NewViewTrackingHandler creates a new view tracking handler
func NewViewTrackingHandler(service domain.ViewTrackingService) *ViewTrackingHandler {
	return &ViewTrackingHandler{
		service: service,
	}
}

// TrackViewRequest represents the request body for tracking a view
type TrackViewRequest struct {
	SessionDuration int `json:"session_duration" binding:"required,min=30"`
}

// TrackView handles POST /api/articles/:id/track-view
// Records a view if session duration >= 30 seconds and no duplicate within 24h
func (h *ViewTrackingHandler) TrackView(c *gin.Context) {
	idOrSlug := c.Param("id")

	if idOrSlug == "" {
		c.Error(apperrors.NewBadRequest("Article identifier is required"))
		return
	}

	var req TrackViewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(apperrors.NewBadRequest("Invalid request: session_duration must be at least 30 seconds"))
		return
	}

	// Get IP address and user agent from request
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Track the view
	err := h.service.TrackView(idOrSlug, ipAddress, userAgent, req.SessionDuration)
	if err != nil {
		// Log error for debugging
		logger.Get().Error("Failed to track view", "error", err, "identifier", idOrSlug, "ip", ipAddress)

		// Check if it's a validation error vs system error
		if err.Error() == "article not found" {
			c.Error(apperrors.NewNotFound("Article not found"))
			return
		}

		// For other errors (like duplicates), return success to maintain UX
		// Silent fail - user still gets a success response
		response.Success(c, gin.H{
			"message": "View recorded",
			"tracked": false,
		})
		return
	}

	response.Success(c, gin.H{
		"message": "View tracked successfully",
		"tracked": true,
	})
}

// GetViewCount handles GET /api/articles/:id/views
// Returns the count of valid views for an article
func (h *ViewTrackingHandler) GetViewCount(c *gin.Context) {
	idOrSlug := c.Param("id")
	if idOrSlug == "" {
		c.Error(apperrors.NewBadRequest("Article identifier is required"))
		return
	}

	count, err := h.service.GetArticleViewCount(idOrSlug)
	if err != nil {
		if err.Error() == "article not found" {
			c.Error(apperrors.NewNotFound("Article not found"))
			return
		}

		c.Error(apperrors.NewInternalError(err))
		return
	}

	response.Success(c, gin.H{
		"identifier": idOrSlug,
		"view_count": count,
	})
}

// GetViewCountByID handles GET /api/articles/:id/views-by-id
// Returns the count of valid views for an article by ID
func (h *ViewTrackingHandler) GetViewCountByID(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.Error(apperrors.NewBadRequest("Article ID is required"))
		return
	}

	articleID, err := uuid.Parse(idStr)
	if err != nil {
		c.Error(apperrors.NewBadRequest("Invalid article ID format"))
		return
	}

	count, err := h.service.GetArticleViewCountByID(articleID)
	if err != nil {
		c.Error(apperrors.NewInternalError(err))
		return
	}

	response.Success(c, gin.H{
		"article_id": articleID,
		"view_count": count,
	})
}
