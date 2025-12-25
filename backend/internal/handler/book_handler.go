package handler

import (
	"net/http"
	"strconv"

	"backend/internal/domain"

	"github.com/gin-gonic/gin"
)

type BookHandler struct {
	service domain.BookService
}

func NewBookHandler(service domain.BookService) *BookHandler {
	return &BookHandler{service: service}
}

func (h *BookHandler) CreateBook(c *gin.Context) {
	var book domain.Book
	if err := c.ShouldBindJSON(&book); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateBook(&book); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, book)
}

func (h *BookHandler) GetBooks(c *gin.Context) {
	books, err := h.service.GetBooks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, books)
}

func (h *BookHandler) GetBook(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	book, err := h.service.GetBook(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}
	c.JSON(http.StatusOK, book)
}
