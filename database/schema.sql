CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    full_name VARCHAR(255),
    avatar_url TEXT,

    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,

    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    refresh_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,

    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- ADMIN | EDITOR | SUBSCRIBER | AUTHOR   
    description TEXT
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,

    parent_id UUID REFERENCES categories(id),
    description TEXT,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,

    author_id UUID REFERENCES users(id),
    category_id UUID REFERENCES categories(id),

    status VARCHAR(30) NOT NULL,
    -- DRAFT | REVIEW | PUBLISHED | SCHEDULED | ARCHIVED

    is_featured BOOLEAN DEFAULT false,
    allow_comment BOOLEAN DEFAULT true,

    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE article_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,

    title TEXT,
    content TEXT,
    summary TEXT,

    version_number INT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE article_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,

    old_status VARCHAR(30),
    new_status VARCHAR(30),
    changed_by UUID REFERENCES users(id),

    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE article_tags (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE article_relations (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    related_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, related_article_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id),

    is_spam BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);



CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    file_name TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,

    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media_file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,

    file_name TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,

    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE article_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
    usage_type VARCHAR(50), -- thumbnail, gallery, inline
    UNIQUE (article_id, media_id)
);

CREATE TABLE article_media_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_media_id UUID REFERENCES article_media(id) ON DELETE CASCADE,

    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
    usage_type VARCHAR(50) -- thumbnail, gallery, inline
);

CREATE TABLE article_seo_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID UNIQUE REFERENCES articles(id) ON DELETE CASCADE,

    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,

    og_image TEXT,
    canonical_url TEXT
);

CREATE TABLE seo_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_slug TEXT UNIQUE NOT NULL,
    to_slug TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE article_seo_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    from_slug TEXT UNIQUE NOT NULL,
    to_slug TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE article_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,

    ip_address INET,
    user_agent TEXT,
    session_duration INTEGER, -- Duration in seconds, NULL for old records, >= 30 for valid views
    viewed_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE article_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    score INT NOT NULL CHECK (score >= 1 AND score <= 5), -- Overall Score
    
    -- Detailed Criteria
    content_score INT DEFAULT 0,  -- Chất lượng nội dung
    clarity_score INT DEFAULT 0,  -- Cách trình bày
    relevance_score INT DEFAULT 0, -- Tính ứng dụng
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (article_id, user_id)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    action VARCHAR(100),
    table_name VARCHAR(100),
    record_id UUID,

    old_data JSONB,
    new_data JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    action VARCHAR(100),
    table_name VARCHAR(100),
    record_id UUID,

    old_data JSONB,
    new_data JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- OPTIMIZATION & PROFESSIONAL FEATURES
-- =========================================

-- 1. Enable Extensions for Advanced Search (Optional but recommended)
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy search and better text indexing

-- 2. Performance Indexes
-- Foreign Keys (PostgreSQL does not index FKs by default)
-- Note: Indexes on the first column of a multi-column PK/UNIQUE constraint are redundant.

-- Users & Sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_assigned_by ON user_roles(assigned_by_id);

-- Roles & Permissions
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Articles & Content
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_category_id ON articles(category_id);
CREATE INDEX idx_article_images_article_id ON article_images(article_id);
CREATE INDEX idx_article_images_is_primary ON article_images(is_primary) WHERE is_primary = true;
CREATE INDEX idx_article_versions_article_id ON article_versions(article_id);
CREATE INDEX idx_article_versions_created_by ON article_versions(created_by);
CREATE INDEX idx_article_status_logs_article_id ON article_status_logs(article_id);
CREATE INDEX idx_article_status_logs_changed_by ON article_status_logs(changed_by);
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);
CREATE INDEX idx_article_relations_related_id ON article_relations(related_article_id);

-- Comments
CREATE INDEX idx_comments_article_id ON comments(article_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
-- Composite for loading article comments (most recent first)
CREATE INDEX idx_comments_article_recent ON comments(article_id, created_at DESC);

-- Media
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_file_versions_media_file_id ON media_file_versions(media_file_id);
CREATE INDEX idx_media_file_versions_uploaded_by ON media_file_versions(uploaded_by);
CREATE INDEX idx_article_media_media_id ON article_media(media_id);
CREATE INDEX idx_article_media_versions_article_media_id ON article_media_versions(article_media_id);
CREATE INDEX idx_article_media_versions_article_id ON article_media_versions(article_id);
CREATE INDEX idx_article_media_versions_media_id ON article_media_versions(media_id);

-- Analytics & Logs
CREATE INDEX idx_article_views_article_id ON article_views(article_id);
CREATE INDEX idx_article_views_viewed_at ON article_views(viewed_at);
-- View tracking indexes for deduplication and valid view counting
CREATE INDEX idx_article_views_dedup ON article_views(article_id, ip_address, viewed_at DESC);
CREATE INDEX idx_article_views_valid ON article_views(article_id, session_duration) WHERE session_duration >= 30;
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);

-- Common Search & Filter Fields
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = true;
-- Optimized index for article listings (published, ordered by date)
CREATE INDEX idx_articles_cat_status_pub ON articles(category_id, status, published_at DESC) WHERE status = 'PUBLISHED';
-- Note: idx_articles_slug and idx_categories_slug removed as they are covered by UNIQUE constraints.

-- Full Text Search Indexes (GIN)
CREATE INDEX idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX idx_articles_content_search ON articles USING gin (to_tsvector('english', content));

-- JSONB Indexes for High-Performance Logging Query
CREATE INDEX idx_audit_logs_old_data ON audit_logs USING gin (old_data);
CREATE INDEX idx_audit_logs_new_data ON audit_logs USING gin (new_data);
CREATE INDEX idx_system_settings_value ON system_settings USING gin (value);

-- 3. Automatic Timestamp Updating (Triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applying triggers to tables with updated_at column
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_ratings_updated_at
    BEFORE UPDATE ON article_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- ARTICLE FULL-TEXT SEARCH SETUP
-- =========================================

ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_articles_search_vector 
ON articles USING gin(search_vector);

CREATE OR REPLACE FUNCTION articles_search_vector_update() 
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_vector on INSERT or UPDATE
DROP TRIGGER IF EXISTS tsvector_articles_update ON articles;
CREATE TRIGGER tsvector_articles_update 
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW 
  EXECUTE FUNCTION articles_search_vector_update();

-- Backfill search_vector for all existing articles
-- This populates the search_vector column for articles that already exist
UPDATE articles 
SET search_vector = 
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(content, '')), 'C')
WHERE search_vector IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN articles.search_vector IS 'Full-text search vector with weighted title (A), summary (B), and content (C)';
COMMENT ON INDEX idx_articles_search_vector IS 'GIN index for fast full-text search on articles';

-- =========================================
-- SEED DATA
-- =========================================

INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'ADMIN', 'Toàn quyền quản trị hệ thống'),
(gen_random_uuid(), 'EDITOR', 'Biên tập nội dung'),
(gen_random_uuid(), 'AUTHOR', 'Tác giả bài viết'),
(gen_random_uuid(), 'SUBSCRIBER', 'Người dùng đăng ký')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, code, description) VALUES
-- User management
(gen_random_uuid(), 'user.read', 'Xem danh sách người dùng'),
(gen_random_uuid(), 'user.create', 'Tạo người dùng'),
(gen_random_uuid(), 'user.update', 'Cập nhật người dùng'),
(gen_random_uuid(), 'user.delete', 'Xóa người dùng'),

-- Role & permission
(gen_random_uuid(), 'role.read', 'Xem vai trò'),
(gen_random_uuid(), 'role.manage', 'Quản lý vai trò và quyền'),

-- Content
(gen_random_uuid(), 'post.read', 'Xem nội dung'),
(gen_random_uuid(), 'post.create', 'Tạo nội dung'),
(gen_random_uuid(), 'post.update', 'Cập nhật nội dung'),
(gen_random_uuid(), 'post.delete', 'Xóa nội dung'),

-- System
(gen_random_uuid(), 'system.settings', 'Cấu hình hệ thống'),
(gen_random_uuid(), 'system.audit', 'Xem nhật ký hệ thống')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'post.read',
  'post.create',
  'post.update'
)
WHERE r.name = 'EDITOR'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'post.read',
  'post.create',
  'post.update'
)
WHERE r.name = 'AUTHOR'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'post.read'
)
WHERE r.name = 'SUBSCRIBER'
ON CONFLICT DO NOTHING;

SELECT * FROM role_permissions;
SELECT * FROM users;
SELECT * FROM roles;
SELECT * FROM tags;
SELECT * FROM categories;

SELECT * FROM articles;
SELECT * FROM article_images;
SELECT * FROM article_versions;
SELECT * FROM article_status_logs;
SELECT * FROM article_tags;
SELECT * FROM article_relations;

SELECT * FROM media_files;
SELECT * FROM media_file_versions;

SELECT * FROM article_media;
SELECT * FROM article_media_versions;
SELECT * FROM article_seo_metadata;
SELECT * FROM seo_redirects;
SELECT * FROM article_seo_redirects;

SELECT * FROM comments;
SELECT * FROM article_ratings;
SELECT * FROM article_views;
SELECT * FROM audit_logs;
SELECT * FROM system_settings;
SELECT * FROM system_logs;

UPDATE articles 
SET view_count = (
    SELECT COUNT(*) 
    FROM article_views 
    WHERE article_views.article_id = articles.id 
    AND article_views.session_duration >= 30
);

UPDATE articles 
SET comment_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.article_id = articles.id 
    AND comments.is_deleted = false
);