package domain

import "time"

type Book struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Author    string    `gorm:"size:255;not null" json:"author"`
	ISBN      string    `gorm:"size:20;unique;not null" json:"isbn"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type BookRepository interface {
	Create(book *Book) error
	GetAll() ([]Book, error)
	GetByID(id uint) (*Book, error)
	Update(book *Book) error
	Delete(id uint) error
}

type BookService interface {
	CreateBook(book *Book) error
	GetBooks() ([]Book, error)
	GetBook(id uint) (*Book, error)
	UpdateBook(book *Book) error
	DeleteBook(id uint) error
}
