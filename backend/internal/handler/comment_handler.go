package handler

import (
	"backend/internal/domain"
	"backend/internal/service"
	"backend/internal/ws"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CommentHandler struct {
	service service.CommentService
	hub     *ws.Hub
}

func NewCommentHandler(service service.CommentService, hub *ws.Hub) *CommentHandler {
	return &CommentHandler{
		service: service,
		hub:     hub,
	}
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	var req struct {
		ArticleID uuid.UUID  `json:"article_id" binding:"required"`
		Content   string     `json:"content" binding:"required"`
		ParentID  *uuid.UUID `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDStr.(uuid.UUID)

	comment := &domain.Comment{
		ArticleID: req.ArticleID,
		UserID:    userID,
		Content:   req.Content,
		ParentID:  req.ParentID,
	}

	if err := h.service.Create(comment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch the comment with user info for broadcasting and response
	completeComment, err := h.service.GetByID(comment.ID.String())
	if err != nil {
		// Fallback to original comment if fetch fails
		completeComment = comment
	}

	// Broadcast to article room with complete user data
	go func() {
		h.hub.BroadcastToRoom(req.ArticleID.String(), "new_comment", completeComment)
	}()

	c.JSON(http.StatusCreated, completeComment)
}

func (h *CommentHandler) GetComments(c *gin.Context) {
	articleID := c.Param("id")
	if _, err := uuid.Parse(articleID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid article ID"})
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	comments, total, err := h.service.GetByArticleID(articleID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": comments,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

func (h *CommentHandler) GetReplies(c *gin.Context) {
	parentID := c.Param("commentId")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	replies, total, err := h.service.GetRepliesByParentID(parentID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": replies,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get comment first to retrieve article_id for broadcasting
	comment, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if err := h.service.Delete(id, userIDStr.(uuid.UUID).String()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast to article room so all viewers get the update
	go func() {
		h.hub.BroadcastToRoom(comment.ArticleID.String(), "comment_deleted", gin.H{"id": id})
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}

func (h *CommentHandler) UpdateComment(c *gin.Context) {
	id := c.Param("id")
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the comment
	if err := h.service.Update(id, userIDStr.(uuid.UUID).String(), req.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch complete comment with user info for broadcasting and response
	completeComment, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tải bình luận đã cập nhật"})
		return
	}

	// Broadcast to article room so all viewers get the update
	go func() {
		h.hub.BroadcastToRoom(completeComment.ArticleID.String(), "comment_updated", completeComment)
	}()

	c.JSON(http.StatusOK, completeComment)
}

func (h *CommentHandler) RestoreComment(c *gin.Context) {
	id := c.Param("id")
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get comment first to retrieve article_id for broadcasting
	comment, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	userID := userIDStr.(uuid.UUID).String()
	if err := h.service.Restore(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast to article room so all viewers get the update
	go func() {
		h.hub.BroadcastToRoom(comment.ArticleID.String(), "comment_restored", gin.H{"id": id})
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Comment restored"})
}
