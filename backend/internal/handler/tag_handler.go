package handler

import (
	"backend/internal/domain"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TagHandler struct {
	service domain.TagService
}

func NewTagHandler(service domain.TagService) *TagHandler {
	return &TagHandler{service: service}
}

func (h *TagHandler) CreateTag(c *gin.Context) {
	var tag domain.Tag
	if err := c.ShouldBindJSON(&tag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateTag(&tag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tag)
}

func (h *TagHandler) GetTags(c *gin.Context) {
	pageStr := c.Query("page")
	limitStr := c.Query("limit")
	search := c.Query("q")
	sortBy := c.Query("sort")
	order := c.Query("order")

	if pageStr != "" || limitStr != "" || search != "" || sortBy != "" || order != "" {
		page, _ := strconv.Atoi(pageStr)
		limit, _ := strconv.Atoi(limitStr)

		result, err := h.service.GetTagList(page, limit, search, sortBy, order)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, result)
		return
	}

	tags, err := h.service.GetTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tags)
}

func (h *TagHandler) GetTag(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		tag, err := h.service.GetTagBySlug(idStr)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
			return
		}
		c.JSON(http.StatusOK, tag)
		return
	}

	tag, err := h.service.GetTagByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
		return
	}
	c.JSON(http.StatusOK, tag)
}

func (h *TagHandler) GetStats(c *gin.Context) {
	stats, err := h.service.GetTagStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *TagHandler) UpdateTag(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var tag domain.Tag
	if err := c.ShouldBindJSON(&tag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	tag.ID = id

	if err := h.service.UpdateTag(&tag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tag)
}

func (h *TagHandler) DeleteTag(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	if err := h.service.DeleteTag(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag deleted successfully"})
}
