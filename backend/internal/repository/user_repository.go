package repository

import (
	"backend/internal/domain"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetUsers(page, limit int, search, sortBy, order string, isActive *bool, roleFilter string) (*domain.PaginatedResult[domain.User], error) {
	var users []domain.User
	var total int64

	query := r.db.Model(&domain.User{}).Preload("Roles")

	// Search filter
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("full_name ILIKE ? OR email ILIKE ?", searchPattern, searchPattern)
	}

	// Active status filter
	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	// Role filter
	if roleFilter != "" {
		query = query.Joins("JOIN user_roles ON users.id = user_roles.user_id").
			Joins("JOIN roles ON user_roles.role_id = roles.id").
			Where("roles.name = ?", roleFilter).
			Distinct()
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// Sorting
	if sortBy == "" {
		sortBy = "created_at"
	}
	if order == "" {
		order = "DESC"
	}
	orderClause := fmt.Sprintf("%s %s", sortBy, order)
	query = query.Order(orderClause)

	// Pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return &domain.PaginatedResult[domain.User]{
		Data: users,
		Pagination: domain.Pagination{
			Page:       page,
			Limit:      limit,
			TotalRows:  total,
			TotalPages: totalPages,
		},
	}, nil
}

func (r *userRepository) GetUserByID(id uuid.UUID) (*domain.User, error) {
	var user domain.User
	err := r.db.Preload("Roles.Permissions").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) UpdateUser(user *domain.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) DeleteUser(id uuid.UUID) error {
	// Soft delete by setting is_active to false
	return r.db.Model(&domain.User{}).Where("id = ?", id).Update("is_active", false).Error
}

func (r *userRepository) AssignRoles(userID uuid.UUID, roleIDs []uuid.UUID, assignedBy uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// First, delete existing role assignments
		if err := tx.Where("user_id = ?", userID).Delete(&domain.UserRole{}).Error; err != nil {
			return err
		}

		// Then, create new role assignments
		for _, roleID := range roleIDs {
			userRole := domain.UserRole{
				UserID:       userID,
				RoleID:       roleID,
				AssignedByID: assignedBy,
			}
			if err := tx.Create(&userRole).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *userRepository) GetRoleAssignments(userID uuid.UUID) ([]domain.UserRole, error) {
	var assignments []domain.UserRole
	err := r.db.Where("user_id = ?", userID).Find(&assignments).Error
	return assignments, err
}

func (r *userRepository) GetUserStats() (*domain.UserStats, error) {
	var stats domain.UserStats

	// Total users
	if err := r.db.Model(&domain.User{}).Count(&stats.TotalUsers).Error; err != nil {
		return nil, err
	}

	// Active users
	if err := r.db.Model(&domain.User{}).Where("is_active = ?", true).Count(&stats.ActiveUsers).Error; err != nil {
		return nil, err
	}

	// Inactive users
	stats.InactiveUsers = stats.TotalUsers - stats.ActiveUsers

	// Role distribution
	var roleCounts []domain.RoleCount
	err := r.db.Table("user_roles").
		Select("roles.name as role_name, COUNT(user_roles.user_id) as count").
		Joins("JOIN roles ON user_roles.role_id = roles.id").
		Group("roles.name").
		Scan(&roleCounts).Error
	if err != nil {
		return nil, err
	}
	stats.RoleDistribution = roleCounts

	return &stats, nil
}

func (r *userRepository) GetAllRoles() ([]domain.Role, error) {
	var roles []domain.Role
	err := r.db.Preload("Permissions").Find(&roles).Error
	return roles, err
}

func (r *userRepository) GetRolesByIDs(roleIDs []uuid.UUID) ([]domain.Role, error) {
	var roles []domain.Role
	err := r.db.Where("id IN ?", roleIDs).Find(&roles).Error
	return roles, err
}
