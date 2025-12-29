package service

import (
	"backend/internal/domain"
	"backend/internal/ws"
	"errors"

	"github.com/google/uuid"
)

type userService struct {
	repo domain.UserRepository
	hub  *ws.Hub
}

func (s *userService) GetRepo() domain.UserRepository {
	return s.repo
}

func NewUserService(repo domain.UserRepository, hub *ws.Hub) domain.UserService {
	return &userService{repo: repo, hub: hub}
}

func (s *userService) GetUserList(page, limit int, search, sortBy, order string, isActive *bool, roleFilter string) (*domain.PaginatedResult[domain.User], error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	return s.repo.GetUsers(page, limit, search, sortBy, order, isActive, roleFilter)
}

func (s *userService) isAdmin(user *domain.User) bool {
	for _, role := range user.Roles {
		if role.Name == "ADMIN" {
			return true
		}
	}
	return false
}

func (s *userService) GetUserDetail(id uuid.UUID) (*domain.User, error) {
	user, err := s.repo.GetUserByID(id)
	if err != nil {
		return nil, errors.New("người dùng không tồn tại")
	}
	return user, nil
}

func (s *userService) UpdateUserProfile(id uuid.UUID, fullName, avatarURL string, isActive bool) error {
	user, err := s.repo.GetUserByID(id)
	if err != nil {
		return errors.New("người dùng không tồn tại")
	}

	// Protection: Admin cannot be inactivated
	if s.isAdmin(user) && !isActive {
		return errors.New("không thể khóa tài khoản quản trị viên")
	}
	user.IsActive = isActive

	err = s.repo.UpdateUser(user)
	if err == nil && !isActive {
		// Emit WebSocket event if locked
		s.hub.SendToUser(id, "account_locked", map[string]string{
			"message": "Tài khoản của bạn đã bị khóa bởi quản trị viên.",
		})
	}
	return err
}

func (s *userService) DeleteUser(id uuid.UUID) error {
	// Check if user exists
	user, err := s.repo.GetUserByID(id)
	if err != nil {
		return errors.New("người dùng không tồn tại")
	}

	// Protection: Admin cannot be deleted
	if s.isAdmin(user) {
		return errors.New("không thể xóa tài khoản quản trị viên")
	}

	// Soft delete by setting is_active to false
	err = s.repo.DeleteUser(id)
	if err == nil {
		// Emit WebSocket event
		s.hub.SendToUser(id, "account_locked", map[string]string{
			"message": "Tài khoản của bạn đã bị khóa bởi quản trị viên.",
		})
	}
	return err
}

func (s *userService) AssignUserRoles(userID uuid.UUID, roleIDs []uuid.UUID, requesterID uuid.UUID) error {
	// Prevent self-role-modification
	if userID == requesterID {
		return errors.New("không thể tự thay đổi quyền của chính mình")
	}

	// Check if target user exists
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return errors.New("người dùng không tồn tại")
	}

	// Hierarchy Check: If target user is an ADMIN, check if requester is the promoter
	if s.isAdmin(user) {
		assignments, err := s.repo.GetRoleAssignments(userID)
		if err != nil {
			return errors.New("không thể kiểm tra lịch sử gán quyền")
		}

		isPromoter := false
		// Get all roles once to find the ADMIN role ID
		allRoles, err := s.repo.GetAllRoles()
		if err != nil {
			return errors.New("không thể lấy danh sách vai trò")
		}

		var adminRoleID uuid.UUID
		for _, r := range allRoles {
			if r.Name == "ADMIN" {
				adminRoleID = r.ID
				break
			}
		}

		// If adminRoleID is still zero, it means ADMIN role doesn't exist, which is an unexpected state.
		// In this case, isPromoter will remain false, and the error below will be returned.

		for _, assignment := range assignments {
			if assignment.RoleID == adminRoleID && assignment.AssignedByID == requesterID {
				isPromoter = true
				break
			}
		}

		if !isPromoter {
			return errors.New("bạn không có quyền gỡ bỏ hoặc thay đổi quyền của Quản trị viên này (chỉ người gán quyền mới có thể thực hiện)")
		}
	}

	// Validate that all roles exist
	if len(roleIDs) > 0 {
		roles, err := s.repo.GetRolesByIDs(roleIDs)
		if err != nil {
			return errors.New("không thể xác thực vai trò")
		}
		if len(roles) != len(roleIDs) {
			return errors.New("một số vai trò không tồn tại")
		}
	}

	err = s.repo.AssignRoles(userID, roleIDs, requesterID)
	if err == nil {
		// Emit WebSocket event to target user
		s.hub.SendToUser(userID, "role_updated", map[string]string{
			"message": "Quyền hạn của bạn đã được cập nhật.",
		})
	}
	return err
}

func (s *userService) GetUserStats() (*domain.UserStats, error) {
	return s.repo.GetUserStats()
}

func (s *userService) GetAvailableRoles() ([]domain.Role, error) {
	return s.repo.GetAllRoles()
}
