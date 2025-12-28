package main

import (
	"log"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/domain"
	"backend/internal/repository"
	"backend/internal/utils"

	"github.com/google/uuid"
)

func main() {
	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Initialize Database
	db.InitDB(cfg)

	// 3. Auto Migration (Ensure tables exist)
	err := db.DB.AutoMigrate(
		&domain.Article{},
		&domain.Category{},
		&domain.User{},
		&domain.Role{},
		&domain.Permission{},
	)
	if err != nil {
		log.Fatalf("AutoMigration failed: %v", err)
	}

	authRepo := repository.NewAuthRepository(db.DB)

	// 4. Seed Admin User
	seedAdmin(authRepo)
}

func seedAdmin(repo *repository.AuthRepository) {
	email := "admin@gmail.com"
	password := "admin123"
	fullName := "System Administrator"

	// Check if admin already exists
	existingUser, _ := repo.GetUserByEmail(email)
	if existingUser != nil {
		log.Printf("Admin user with email %s already exists. Skipping seed.", email)
		return
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Get ADMIN role
	adminRole, err := repo.GetRoleByName("ADMIN")
	if err != nil {
		log.Fatalf("Role 'ADMIN' not found. Please ensure roles are seeded in the database: %v", err)
	}

	user := &domain.User{
		ID:           uuid.New(),
		Email:        email,
		PasswordHash: hashedPassword,
		FullName:     fullName,
		Roles:        []domain.Role{*adminRole},
	}

	err = repo.CreateUser(user)
	if err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	log.Printf("Successfully seeded admin user: %s", email)
}
