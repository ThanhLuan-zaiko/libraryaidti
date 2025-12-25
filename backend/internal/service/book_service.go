package service

import (
	"backend/internal/domain"
)

type bookService struct {
	repo domain.BookRepository
}

func NewBookService(repo domain.BookRepository) domain.BookService {
	return &bookService{repo: repo}
}

func (s *bookService) CreateBook(book *domain.Book) error {
	return s.repo.Create(book)
}

func (s *bookService) GetBooks() ([]domain.Book, error) {
	return s.repo.GetAll()
}

func (s *bookService) GetBook(id uint) (*domain.Book, error) {
	return s.repo.GetByID(id)
}

func (s *bookService) UpdateBook(book *domain.Book) error {
	return s.repo.Update(book)
}

func (s *bookService) DeleteBook(id uint) error {
	return s.repo.Delete(id)
}
