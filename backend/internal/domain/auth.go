package domain

import "github.com/google/uuid"

type AuthRepository interface {
	CreateUser(user *User) error
	GetUserByEmail(email string) (*User, error)
	GetUserByID(id uuid.UUID) (*User, error)
	GetRoleByName(name string) (*Role, error)
	UpdateUser(user *User) error
}

type AuthService interface {
	Register(email, password, fullName string) error
	Login(email, password string) (*User, error)
	GetMe(userID uuid.UUID) (*User, error)
	UpdateProfile(userID uuid.UUID, fullName string) error
	ChangePassword(userID uuid.UUID, currentPassword, newPassword string) error
}
