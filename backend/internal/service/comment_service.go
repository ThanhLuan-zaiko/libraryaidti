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
	Update(id string, userID string, content string) error // userID to check ownership
	GetByID(id string) (*domain.Comment, error)
	GetByArticleID(articleID string, page, limit int) ([]domain.Comment, int64, error)
	GetRepliesByParentID(parentID string, page, limit int) ([]domain.Comment, int64, error)
	Delete(id string, userID string) error  // userID to check ownership
	Restore(id string, userID string) error // userID to check ownership
}

type commentService struct {
	repo        repository.CommentRepository
	articleRepo domain.ArticleRepository
}

func NewCommentService(repo repository.CommentRepository, articleRepo domain.ArticleRepository) CommentService {
	return &commentService{
		repo:        repo,
		articleRepo: articleRepo,
	}
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

	// Content length validation
	const MaxCommentLength = 5000
	const MinCommentLength = 1

	contentLen := len([]rune(comment.Content)) // Count Unicode characters, not bytes
	if contentLen > MaxCommentLength {
		return errors.New("bình luận quá dài (tối đa 5000 ký tự)")
	}
	if contentLen < MinCommentLength {
		return errors.New("bình luận quá ngắn")
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

	err := s.repo.Create(comment)
	if err == nil {
		// Sync comment_count in articles table
		_ = s.articleRepo.IncrementCommentCount(comment.ArticleID)
	}
	return err
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

func (s *commentService) GetRepliesByParentID(parentID string, page, limit int) ([]domain.Comment, int64, error) {
	// Validate parent exists
	_, err := s.repo.GetByID(parentID)
	if err != nil {
		return nil, 0, errors.New("bình luận gốc không tồn tại")
	}

	return s.repo.GetRepliesByParentID(parentID, page, limit)
}

func (s *commentService) Update(id string, userID string, content string) error {
	comment, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("bình luận không tồn tại")
	}

	// Check ownership
	if comment.UserID.String() != userID {
		return errors.New("bạn không có quyền chỉnh sửa bình luận này")
	}

	// Check if comment is deleted
	if comment.IsDeleted {
		return errors.New("không thể chỉnh sửa bình luận đã bị thu hồi")
	}

	// Check edit time limit (15 minutes)
	const editTimeLimit = 15 * time.Minute
	if time.Since(comment.CreatedAt) > editTimeLimit {
		return errors.New("đã hết thời gian chỉnh sửa (15 phút)")
	}

	// Validate content
	if content == "" {
		return errors.New("nội dung không được để trống")
	}

	const MaxCommentLength = 5000
	const MinCommentLength = 1
	contentLen := len([]rune(content))
	if contentLen > MaxCommentLength {
		return errors.New("bình luận quá dài (tối đa 5000 ký tự)")
	}
	if contentLen < MinCommentLength {
		return errors.New("bình luận quá ngắn")
	}

	// Update content and timestamp
	comment.Content = content
	comment.UpdatedAt = time.Now().UTC()

	return s.repo.Update(comment)
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

	err = s.repo.Delete(id)
	if err == nil {
		// Sync comment_count in articles table
		_ = s.articleRepo.DecrementCommentCount(comment.ArticleID)
	}
	return err
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
