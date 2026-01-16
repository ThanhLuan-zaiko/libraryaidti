package apperrors

import (
	"net/http"
	"strings"
)

// AppError is the standard error struct for the application
type AppError struct {
	Code    int    `json:"code,omitempty"`
	Message string `json:"message"`
	Err     error  `json:"-"` // Internal error, not exposed to client
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

// Unwrap returns the internal error
func (e *AppError) Unwrap() error {
	return e.Err
}

// NewBadRequest creates a 400 Bad Request error
func NewBadRequest(message string) *AppError {
	return &AppError{
		Code:    http.StatusBadRequest,
		Message: message,
	}
}

// NewUnauthorized creates a 401 Unauthorized error
func NewUnauthorized(message string) *AppError {
	return &AppError{
		Code:    http.StatusUnauthorized,
		Message: message,
	}
}

// NewForbidden creates a 403 Forbidden error
func NewForbidden(message string) *AppError {
	return &AppError{
		Code:    http.StatusForbidden,
		Message: message,
	}
}

// NewNotFound creates a 404 Not Found error
func NewNotFound(message string) *AppError {
	return &AppError{
		Code:    http.StatusNotFound,
		Message: message,
	}
}

// NewInternalError creates a 500 Internal Server Error
func NewInternalError(err error) *AppError {
	return &AppError{
		Code:    http.StatusInternalServerError,
		Message: "Đã xảy ra lỗi hệ thống",
		Err:     err,
	}
}

// NewInternalError msg creates a 500 Internal Server Error with custom message
func NewInternalServerError(message string, err error) *AppError {
	return &AppError{
		Code:    http.StatusInternalServerError,
		Message: message,
		Err:     err,
	}
}

// Validation error translator (Simple map based approach)
// In a real app, use go-playground/validator/v10/translations
func TranslateValidationError(err error) *AppError {
	// Simple string parsing or type assertion if we imported validator pkg
	// But to keep it simple and dependency-light in this file:

	msg := "Dữ liệu không hợp lệ"
	errStr := err.Error()

	// Rough mapping based on standard Gin/Validator output
	switch {
	case strings.Contains(errStr, "'Title' failed on the 'required' tag"):
		msg = "Tiêu đề không được để trống"
	case strings.Contains(errStr, "'Content' failed on the 'required' tag"):
		msg = "Nội dung bài viết không được để trống"
	case strings.Contains(errStr, "'Summary' failed on the 'required' tag"):
		msg = "Tóm tắt không được để trống"
	case strings.Contains(errStr, "'CategoryID' failed on the 'required' tag"):
		msg = "Vui lòng chọn danh mục"
	case strings.Contains(errStr, "'Tags' failed on the 'required' tag"):
		msg = "Phải có ít nhất một thẻ (tag)"
	case strings.Contains(errStr, "'Tags' failed on the 'min' tag"):
		msg = "Phải có ít nhất một thẻ (tag)"
	case strings.Contains(errStr, "'Images' failed on the 'required' tag"):
		msg = "Phải có ít nhất một ảnh"
	case strings.Contains(errStr, "'Images' failed on the 'min' tag"):
		msg = "Phải có ít nhất một ảnh"
	case strings.Contains(errStr, "'Email' failed on the 'required' tag"):
		msg = "Email không được để trống"
	case strings.Contains(errStr, "'Email' failed on the 'email' tag"):
		msg = "Định dạng email không hợp lệ"
	case strings.Contains(errStr, "'Password' failed on the 'required' tag"):
		msg = "Mật khẩu không được để trống"
	case strings.Contains(errStr, "'Password' failed on the 'min' tag"):
		msg = "Mật khẩu phải có ít nhất 6 ký tự"
	// SEO Validation
	case strings.Contains(errStr, "'MetaTitle' failed on the 'max' tag"):
		msg = "Meta Title quá dài (tối đa 100 ký tự)"
	case strings.Contains(errStr, "'MetaDescription' failed on the 'max' tag"):
		msg = "Meta Description quá dài (tối đa 300 ký tự)"
	case strings.Contains(errStr, "'MetaKeywords' failed on the 'max' tag"):
		msg = "Meta Keywords quá dài (tối đa 500 ký tự)"
	}

	return NewBadRequest(msg)
}
