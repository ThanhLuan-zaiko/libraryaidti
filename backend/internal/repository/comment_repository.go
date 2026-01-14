package repository

import (
	"backend/internal/domain"

	"gorm.io/gorm"
)

type CommentRepository interface {
	Create(comment *domain.Comment) error
	GetByID(id string) (*domain.Comment, error)
	GetByArticleID(articleID string, page, limit int) ([]domain.Comment, int64, error)
	GetLastCommentByUserID(userID string) (*domain.Comment, error)
	Update(comment *domain.Comment) error
	Delete(id string) error
	Restore(id string) error
}

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) Create(comment *domain.Comment) error {
	return r.db.Create(comment).Error
}

func (r *commentRepository) GetByID(id string) (*domain.Comment, error) {
	var comment domain.Comment
	err := r.db.Preload("User").First(&comment, "id = ?", id).Error
	return &comment, err
}

func (r *commentRepository) GetByArticleID(articleID string, page, limit int) ([]domain.Comment, int64, error) {
	var comments []domain.Comment
	var total int64
	offset := (page - 1) * limit

	query := r.db.Model(&domain.Comment{}).Where("article_id = ? AND parent_id IS NULL AND is_deleted = false", articleID)

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.
		Preload("User").
		Preload("Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.User").
		Preload("Replies.Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.Replies.User").
		Preload("Replies.Replies.Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.Replies.Replies.User").
		Preload("Replies.Replies.Replies.Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.Replies.Replies.Replies.User").
		Preload("Replies.Replies.Replies.Replies.Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.Replies.Replies.Replies.Replies.User").
		Preload("Replies.Replies.Replies.Replies.Replies.Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.Replies.Replies.Replies.Replies.Replies.User").
		Preload("Replies.Replies.Replies.Replies.Replies.Replies.Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.Replies.Replies.Replies.Replies.Replies.Replies.User").
		Preload("Replies.Replies.Replies.Replies.Replies.Replies.Replies.Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.Replies.Replies.Replies.Replies.Replies.Replies.Replies.User").
		Preload("Replies.Replies.Replies.Replies.Replies.Replies.Replies.Replies.Replies", func(db *gorm.DB) *gorm.DB { return db.Order("created_at asc") }).
		Preload("Replies.Replies.Replies.Replies.Replies.Replies.Replies.Replies.Replies.User").
		Order("created_at desc").
		Offset(offset).
		Limit(limit).
		Find(&comments).Error

	return comments, total, err
}

func (r *commentRepository) GetLastCommentByUserID(userID string) (*domain.Comment, error) {
	var comment domain.Comment
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").First(&comment).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *commentRepository) Update(comment *domain.Comment) error {
	return r.db.Save(comment).Error
}

func (r *commentRepository) Delete(id string) error {
	return r.db.Model(&domain.Comment{}).Where("id = ?", id).Update("is_deleted", true).Error
}

func (r *commentRepository) Restore(id string) error {
	return r.db.Model(&domain.Comment{}).Where("id = ?", id).Update("is_deleted", false).Error
}
