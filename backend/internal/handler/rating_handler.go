package handler

import (
	"backend/internal/domain"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RatingHandler struct {
	service domain.RatingService
}

func NewRatingHandler(service domain.RatingService) *RatingHandler {
	return &RatingHandler{service: service}
}

func (h *RatingHandler) RateArticle(c *gin.Context) {
	articleID := c.Param("id")
	var req domain.RatingDetail

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID).String()

	if err := h.service.RateArticle(articleID, userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đánh giá thành công"})
}

func (h *RatingHandler) GetRating(c *gin.Context) {
	articleID := c.Param("id")

	avg, count, err := h.service.GetRatingStats(articleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var userRating *domain.RatingDetail
	userIDVal, exists := c.Get("user_id")
	if exists {
		userID := userIDVal.(uuid.UUID).String()
		rating, err := h.service.GetUserRating(articleID, userID)
		if err == nil && rating != nil {
			userRating = &domain.RatingDetail{
				Content:   rating.ContentScore,
				Clarity:   rating.ClarityScore,
				Relevance: rating.RelevanceScore,
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"average":     avg,
		"count":       count,
		"user_rating": userRating,
	})
}
