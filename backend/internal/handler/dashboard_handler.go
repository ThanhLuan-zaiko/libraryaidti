package handler

import (
	"backend/internal/domain"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	service domain.DashboardService
}

func NewDashboardHandler(service domain.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) GetAnalytics(c *gin.Context) {
	analytics, err := h.service.GetAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}
