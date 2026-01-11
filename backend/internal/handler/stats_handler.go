package handler

import (
	"backend/internal/domain"
	"net/http"

	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	service domain.StatsService
}

func NewStatsHandler(service domain.StatsService) *StatsHandler {
	return &StatsHandler{service: service}
}

func (h *StatsHandler) GetDashboardData(c *gin.Context) {
	data, err := h.service.GetDashboardData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

func (h *StatsHandler) GetPublicStats(c *gin.Context) {
	data, err := h.service.GetPublicStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}
