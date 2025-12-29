package service

import (
	"backend/internal/domain"
	"backend/internal/repository"
	"backend/internal/utils"
	"errors"

	"github.com/google/uuid"
)

type AuthService struct {
	repo *repository.AuthRepository
}

func NewAuthService(repo *repository.AuthRepository) *AuthService {
	return &AuthService{repo: repo}
}

func (s *AuthService) Register(email, password, fullName string) error {
	// Check if user already exists
	existingUser, _ := s.repo.GetUserByEmail(email)
	if existingUser != nil {
		return errors.New("Tài khoản đã tồn tại")
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	// Get default role SUBSCRIBER
	subscriberRole, err := s.repo.GetRoleByName("SUBSCRIBER")
	if err != nil {
		return errors.New("không tìm thấy vai trò mặc định SUBSCRIBER")
	}

	user := &domain.User{
		Email:        email,
		PasswordHash: hashedPassword,
		FullName:     fullName,
		Roles:        []domain.Role{*subscriberRole},
	}

	return s.repo.CreateUser(user)
}

type LoginResponse struct {
	User domain.User `json:"user"`
}

func (s *AuthService) Login(email, password string) (*domain.User, error) {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		return nil, errors.New("email hoặc mật khẩu không chính xác")
	}

	match, err := utils.VerifyPassword(password, user.PasswordHash)
	if err != nil || !match {
		return nil, errors.New("email hoặc mật khẩu không chính xác")
	}

	if !user.IsActive {
		return nil, errors.New("tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên")
	}

	return user, nil
}

func (s *AuthService) UpdateProfile(userID uuid.UUID, fullName string) error {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return errors.New("không tìm thấy người dùng")
	}

	user.FullName = fullName
	return s.repo.UpdateUser(user)
}

func (s *AuthService) ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return errors.New("không tìm thấy người dùng")
	}

	match, err := utils.VerifyPassword(oldPassword, user.PasswordHash)
	if err != nil || !match {
		return errors.New("mật khẩu cũ không chính xác")
	}

	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	user.PasswordHash = hashedPassword
	return s.repo.UpdateUser(user)
}
