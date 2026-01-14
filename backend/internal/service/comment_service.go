package service

import (
	"backend/internal/domain"
	"backend/internal/repository"
	"errors"
	"time"

	"github.com/google/uuid"
)

type CommentService interface {
	Create(comment *domain.Comment) error
	GetByID(id string) (*domain.Comment, error)
	GetByArticleID(articleID string, page, limit int) ([]domain.Comment, int64, error)
	Delete(id string, userID string) error  // userID to check ownership
	Restore(id string, userID string) error // userID to check ownership
}

type commentService struct {
	repo repository.CommentRepository
}

func NewCommentService(repo repository.CommentRepository) CommentService {
	return &commentService{repo: repo}
}

func (s *commentService) Create(comment *domain.Comment) error {
	// Force UTC timestamp
	comment.CreatedAt = time.Now().UTC()

	if comment.ArticleID == uuid.Nil {
		return errors.New("thiếu thông tin bài viết")
	}
	if comment.UserID == uuid.Nil {
		return errors.New("thiếu thông tin người dùng")
	}
	if comment.Content == "" {
		return errors.New("nội dung không được để trống")
	}

	// If replying, check if parent exists (optional but good practice)
	if comment.ParentID != nil && *comment.ParentID != uuid.Nil {
		parent, err := s.repo.GetByID(comment.ParentID.String())
		if err != nil {
			return errors.New("bình luận phản hồi không tồn tại")
		}

		// Check depth limit (max 10 levels)
		depth := s.calculateDepth(parent)
		if depth >= 10 {
			return errors.New("đã đạt giới hạn độ sâu bình luận (tối đa 10 cấp)")
		}
	}

	// SPAM CHECK
	lastComment, _ := s.repo.GetLastCommentByUserID(comment.UserID.String())
	if lastComment != nil {
		duration := time.Since(lastComment.CreatedAt)
		if duration > 0 && duration < 3*time.Second {
			return errors.New("bình luận quá nhanh, vui lòng đợi vài giây")
		}
		// Duplicate content check (within 30 seconds)
		if lastComment.Content == comment.Content && time.Since(lastComment.CreatedAt) < 30*time.Second {
			return errors.New("bạn vừa đăng nội dung này rồi, vui lòng đợi chút")
		}
	}

	return s.repo.Create(comment)
}

// calculateDepth recursively calculates the depth of a comment in the tree
func (s *commentService) calculateDepth(comment *domain.Comment) int {
	if comment.ParentID == nil || *comment.ParentID == uuid.Nil {
		return 0
	}

	parent, err := s.repo.GetByID(comment.ParentID.String())
	if err != nil {
		return 0 // If parent not found, treat as root level
	}

	return 1 + s.calculateDepth(parent)
}

func (s *commentService) GetByID(id string) (*domain.Comment, error) {
	return s.repo.GetByID(id)
}

func (s *commentService) GetByArticleID(articleID string, page, limit int) ([]domain.Comment, int64, error) {
	return s.repo.GetByArticleID(articleID, page, limit)
}

func (s *commentService) Delete(id string, userID string) error {
	comment, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Check ownership
	if comment.UserID.String() != userID {
		return errors.New("bạn không có quyền thu hồi bình luận này")
	}

	return s.repo.Delete(id)
}

func (s *commentService) Restore(id string, userID string) error {
	comment, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Check ownership
	if comment.UserID.String() != userID {
		return errors.New("bạn không có quyền phục hồi bình luận này")
	}

	// Check if already active
	if !comment.IsDeleted {
		return errors.New("bình luận này chưa bị thu hồi")
	}

	return s.repo.Restore(id)
}
