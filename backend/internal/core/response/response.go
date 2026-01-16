package response

import (
	apperrors "backend/internal/core/error"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response standard structure
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Meta    interface{} `json:"meta,omitempty"`
	Error   *ErrorData  `json:"error,omitempty"`
}

type ErrorData struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Success sends a success response
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
	})
}

// SuccessWithMeta sends a success response with metadata (e.g. pagination)
func SuccessWithMeta(c *gin.Context, data interface{}, meta interface{}) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

// Created sends a 201 Created response
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    data,
	})
}

// Error sends an error response
func Error(c *gin.Context, err error) {
	var appErr *apperrors.AppError
	var code int
	var message string

	if e, ok := err.(*apperrors.AppError); ok {
		appErr = e
		code = appErr.Code
		message = appErr.Message
	} else {
		// Default to 500
		code = http.StatusInternalServerError
		message = "Lỗi không xác định"
		if err != nil {
			// In debug mode, we might want to expose this, but strictly not in prod
			// keeping it simple for now
			// message = err.Error()
		}
	}

	c.JSON(code, Response{
		Success: false,
		Error: &ErrorData{
			Code:    code,
			Message: message,
		},
	})
}
