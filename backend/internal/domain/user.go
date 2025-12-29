package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email         string     `gorm:"unique;not null" json:"email"`
	PasswordHash  string     `gorm:"not null" json:"-"`
	FullName      string     `json:"full_name"`
	AvatarURL     string     `json:"avatar_url"`
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	EmailVerified bool       `gorm:"default:false" json:"email_verified"`
	LastLoginAt   *time.Time `json:"last_login_at"`
	CreatedAt     time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"default:now()" json:"updated_at"`
	Roles         []Role     `gorm:"many2many:user_roles;" json:"roles"`
}

type Role struct {
	ID          uuid.UUID    `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string       `gorm:"unique;not null" json:"name"`
	Description string       `json:"description"`
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions"`
}

type Permission struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Code        string    `gorm:"unique;not null" json:"code"`
	Description string    `json:"description"`
}

type UserRole struct {
	UserID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	RoleID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"role_id"`
	AssignedByID uuid.UUID `gorm:"type:uuid" json:"assigned_by_id"`
}

type RolePermission struct {
	RoleID       uuid.UUID `gorm:"type:uuid;primaryKey"`
	PermissionID uuid.UUID `gorm:"type:uuid;primaryKey"`
}

// UserStats represents user statistics
type UserStats struct {
	TotalUsers       int64       `json:"total_users"`
	ActiveUsers      int64       `json:"active_users"`
	InactiveUsers    int64       `json:"inactive_users"`
	RoleDistribution []RoleCount `json:"role_distribution"`
}

type RoleCount struct {
	RoleName string `json:"role_name"`
	Count    int64  `json:"count"`
}

// UserRepository defines the interface for user data access
type UserRepository interface {
	GetUsers(page, limit int, search, sortBy, order string, isActive *bool, roleFilter string) (*PaginatedResult[User], error)
	GetUserByID(id uuid.UUID) (*User, error)
	UpdateUser(user *User) error
	DeleteUser(id uuid.UUID) error
	AssignRoles(userID uuid.UUID, roleIDs []uuid.UUID, assignedBy uuid.UUID) error
	GetRoleAssignments(userID uuid.UUID) ([]UserRole, error)
	GetUserStats() (*UserStats, error)
	GetAllRoles() ([]Role, error)
	GetRolesByIDs(roleIDs []uuid.UUID) ([]Role, error)
}

// UserService defines the interface for user business logic
type UserService interface {
	GetUserList(page, limit int, search, sortBy, order string, isActive *bool, roleFilter string) (*PaginatedResult[User], error)
	GetUserDetail(id uuid.UUID) (*User, error)
	UpdateUserProfile(id uuid.UUID, fullName, avatarURL string, isActive bool) error
	DeleteUser(id uuid.UUID) error
	AssignUserRoles(userID uuid.UUID, roleIDs []uuid.UUID, requesterID uuid.UUID) error
	GetUserStats() (*UserStats, error)
	GetAvailableRoles() ([]Role, error)
	GetRepo() UserRepository
}
