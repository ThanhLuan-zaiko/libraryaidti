package handler

import (
	"backend/internal/domain"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuditHandler struct {
	service domain.AuditService
}

func NewAuditHandler(service domain.AuditService) *AuditHandler {
	return &AuditHandler{service: service}
}

func (h *AuditHandler) GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := make(map[string]interface{})
	if action := c.Query("action"); action != "" {
		filter["action"] = action
	}
	if tableName := c.Query("table_name"); tableName != "" {
		filter["table_name"] = tableName
	}
	if search := c.Query("search"); search != "" {
		filter["search"] = search
	}

	logs, total, err := h.service.GetAuditLogs(page, limit, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *AuditHandler) GetSystemLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := make(map[string]interface{})
	if action := c.Query("action"); action != "" {
		filter["action"] = action
	}
	if search := c.Query("search"); search != "" {
		filter["search"] = search
	}

	logs, total, err := h.service.GetSystemLogs(page, limit, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *AuditHandler) GetAuditLog(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	log, err := h.service.GetAuditLog(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
		return
	}

	c.JSON(http.StatusOK, log)
}

func (h *AuditHandler) GetSystemLog(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	log, err := h.service.GetSystemLog(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Log not found"})
		return
	}

	c.JSON(http.StatusOK, log)
}
