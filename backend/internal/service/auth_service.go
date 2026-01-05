package service

import (
	"backend/internal/domain"
	"backend/internal/utils"
	"errors"
	"time"

	"github.com/google/uuid"
)

type authService struct {
	repo      domain.AuthRepository
	auditRepo domain.AuditRepository
}

func NewAuthService(repo domain.AuthRepository, auditRepo domain.AuditRepository) domain.AuthService {
	return &authService{
		repo:      repo,
		auditRepo: auditRepo,
	}
}

func (s *authService) Register(email, password, fullName string) error {
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

func (s *authService) Login(email, password string) (*domain.User, error) {
	// Find user
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		return nil, errors.New("thông tin xác thực không hợp lệ")
	}

	// Verify password
	isCorrect, err := utils.VerifyPassword(password, user.PasswordHash)
	if err != nil || !isCorrect {
		return nil, errors.New("thông tin xác thực không hợp lệ")
	}

	// Log Action
	s.auditRepo.Create(&domain.AuditLog{
		ID:        uuid.New(),
		UserID:    user.ID,
		Action:    "LOGIN",
		TableName: "users",
		RecordID:  user.ID,
		CreatedAt: time.Now(),
	})

	return user, nil
}

func (s *authService) UpdateProfile(userID uuid.UUID, fullName string) error {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return errors.New("không tìm thấy người dùng")
	}

	user.FullName = fullName
	return s.repo.UpdateUser(user)
}

func (s *authService) ChangePassword(userID uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	isCorrect, err := utils.VerifyPassword(currentPassword, user.PasswordHash)
	if err != nil || !isCorrect {
		return errors.New("mật khẩu hiện tại không hợp lệ")
	}

	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	user.PasswordHash = hashedPassword
	return s.repo.UpdateUser(user)
}

func (s *authService) GetMe(userID uuid.UUID) (*domain.User, error) {
	return s.repo.GetUserByID(userID)
}
