package repository

import (
	"backend/internal/domain"

	"gorm.io/gorm"
)

type bookRepository struct {
	db *gorm.DB
}

func NewBookRepository(db *gorm.DB) domain.BookRepository {
	return &bookRepository{db: db}
}

func (r *bookRepository) Create(book *domain.Book) error {
	return r.db.Create(book).Error
}

func (r *bookRepository) GetAll() ([]domain.Book, error) {
	var books []domain.Book
	err := r.db.Find(&books).Error
	return books, err
}

func (r *bookRepository) GetByID(id uint) (*domain.Book, error) {
	var book domain.Book
	err := r.db.First(&book, id).Error
	return &book, err
}

func (r *bookRepository) Update(book *domain.Book) error {
	return r.db.Save(book).Error
}

func (r *bookRepository) Delete(id uint) error {
	return r.db.Delete(&domain.Book{}, id).Error
}
