
CREATE DATABASE IF NOT EXISTS ai_studyhub
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE ai_studyhub;    

-- =====================================================
-- 1. SUBSCRIPTION PLANS
-- Quản lý các gói sử dụng hệ thống
-- FREE
-- PRO
-- PREMIUM
-- Dùng để giới hạn:
-- Storage
-- AI Requests
-- Premium Features
-- =====================================================

CREATE TABLE subscription_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plan_name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    storage_limit_mb BIGINT NOT NULL,
    ai_requests_per_day INT NOT NULL,
    download_limit INT NOT NULL DEFAULT 0,
    bookmark_limit INT NOT NULL DEFAULT 0,
    duration_days INT NOT NULL DEFAULT 30,
    can_use_ai_summary BOOLEAN NOT NULL DEFAULT TRUE,
    can_use_flashcards BOOLEAN NOT NULL DEFAULT TRUE,
    can_use_quizzes BOOLEAN NOT NULL DEFAULT TRUE,
    can_publish_documents BOOLEAN NOT NULL DEFAULT FALSE,
    can_publish_folders BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE subscription_plan_versions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subscription_plan_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(12,2) NOT NULL,
    storage_limit_mb BIGINT NOT NULL,
    ai_requests_per_day INT NOT NULL,
    download_limit INT NOT NULL DEFAULT 0,
    bookmark_limit INT NOT NULL DEFAULT 0,
    duration_days INT NOT NULL,
    can_use_ai_summary BOOLEAN NOT NULL,
    can_use_flashcards BOOLEAN NOT NULL,
    can_use_quizzes BOOLEAN NOT NULL,
    can_publish_documents BOOLEAN NOT NULL,
    can_publish_folders BOOLEAN NOT NULL,
    effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_plan_version UNIQUE (subscription_plan_id, version_number),
    CONSTRAINT fk_plan_versions_plan FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)
);

-- =====================================================
-- 2. MAJORS
-- Danh sách ngành học FPT
-- Software Engineering - SE
-- Artificial Intelligence - AI
-- Information Assurance - IA
-- Business Administration - BA
-- =====================================================

CREATE TABLE majors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    major_code VARCHAR(20) UNIQUE NOT NULL,
    major_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. ROLES
-- ADMIN
-- USER
-- hệ thống phân quyền
-- =====================================================

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    role_name VARCHAR(50)
        UNIQUE NOT NULL
);

-- =====================================================
-- 4. USERS
-- Thông tin tài khoản sinh viên
-- Chứa:
-- Student Code
-- Email
-- Avatar
-- Campus
-- Major
-- Subscription Plan
-- Role (mỗi user 1 role duy nhất)
-- =====================================================

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    campus ENUM(
        'HCM',
        'HN',
        'DN',
        'CT',
        'QN'
    ) DEFAULT 'HCM',
    major_id BIGINT,
    plan_id BIGINT DEFAULT 1,
    role_id BIGINT,
    current_semester VARCHAR(20),
    status ENUM(
        'ACTIVE',
        'INACTIVE',
        'BANNED'
    ) DEFAULT 'ACTIVE',
    
    verification_status ENUM(
    'UNVERIFIED',
    'PENDING',
    'APPROVED',
    'REJECTED'
	) DEFAULT 'UNVERIFIED',
    storage_status ENUM(
        'NORMAL',
        'OVER_QUOTA'
    ) DEFAULT 'NORMAL',

	verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_users_major
        FOREIGN KEY (major_id)
        REFERENCES majors(id),
    CONSTRAINT fk_users_plan
        FOREIGN KEY (plan_id)
        REFERENCES subscription_plans(id),
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
);

-- =====================================================
-- 5. USER ROLES (REMOVED)
-- Trực tiếp lưu role_id trong bảng users (mỗi user 1 role duy nhất)
-- =====================================================

-- =====================================================
-- 6. REFRESH TOKENS
-- JWT Authentication
-- lưu refresh token
-- logout nhiều thiết bị
-- revoke token
-- =====================================================

CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- 7. ACTIVITY LOG
-- theo dõi lịch sử đăng nhập
-- security
-- analytics
-- audit
-- =====================================================

CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =====================================================
-- 8. VERIFY STUDENT
-- kiểm tra danh tính sinh viên
-- gmail/ ảnh sinh viên
-- =====================================================
CREATE TABLE student_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    image_url VARCHAR(500) NOT NULL,
    status ENUM(
        'UNVERIFIED',
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'PENDING',
    review_note TEXT,
    reviewed_by BIGINT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_verification_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_verification_admin
        FOREIGN KEY(reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- 9. COURSES
-- Danh sách môn học
-- SWP391
-- PRJ301
-- DBI202
-- OSG202
-- ...
-- =====================================================

CREATE TABLE courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20)
        UNIQUE NOT NULL,
    course_name VARCHAR(255)
        NOT NULL,
	description TEXT,
    major_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_courses_major
        FOREIGN KEY(major_id)
        REFERENCES majors(id)
);

-- =====================================================
-- 9. DOCUMENT CATEGORIES
-- Lecture
-- Assignment
-- Lab
-- Exam
-- Reference
-- Notes
-- =====================================================

CREATE TABLE document_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100)
        UNIQUE NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- USERS
CREATE INDEX idx_users_email
ON users(email);


CREATE INDEX idx_users_major
ON users(major_id);

CREATE INDEX idx_users_plan
ON users(plan_id);

CREATE INDEX idx_users_role
ON users(role_id);

-- REFRESH TOKENS
CREATE INDEX idx_refresh_token
ON refresh_tokens(token);

CREATE INDEX idx_refresh_user
ON refresh_tokens(user_id);

-- ACTIVITY LOG
CREATE INDEX idx_activity_logs_user
ON activity_logs(user_id);

CREATE INDEX idx_activity_logs_action
ON activity_logs(action_type);

CREATE INDEX idx_activity_logs_time
ON activity_logs(created_at);

-- COURSES
CREATE INDEX idx_courses_major
ON courses(major_id);


-- =====================================================
-- 10. FOLDERS
-- phân loại
-- =====================================================

CREATE TABLE folders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    folder_name VARCHAR(255) NOT NULL,
    parent_folder_id BIGINT NULL,
    visibility ENUM(
        'PUBLIC',
        'PRIVATE'
    ) DEFAULT 'PRIVATE',
    published_at TIMESTAMP NULL,
    UNIQUE(user_id, parent_folder_id, folder_name),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_folder_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_folder_parent
        FOREIGN KEY(parent_folder_id)
        REFERENCES folders(id)
        ON DELETE CASCADE
);

-- =====================================================
-- 11. DOCUMENTS
-- Bảng trung tâm của hệ thống
-- Chứa:
-- File upload
-- Metadata
-- AI Summary
-- View Count
-- Download Count
-- Rating
-- Visibility
-- =====================================================

CREATE TABLE documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NULL,
    category_id BIGINT,
    folder_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
      description TEXT,
      semester VARCHAR(30),
      file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size BIGINT NOT NULL,
    UNIQUE(file_url),
    file_type ENUM(
        'PDF',
        'DOCX',
        'PPTX',
        'TXT',
        'ZIP'
    ) NOT NULL,

    visibility ENUM(
        'PUBLIC',
        'PRIVATE'
    ) DEFAULT 'PRIVATE',
    moderation_status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'APPROVED',
    average_rating DECIMAL(2,1) DEFAULT 0,
    total_views INT DEFAULT 0,
    total_downloads INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_documents_user
        FOREIGN KEY(user_id)
        REFERENCES users(id),
    CONSTRAINT fk_documents_course
        FOREIGN KEY(course_id)
        REFERENCES courses(id),
    CONSTRAINT fk_documents_category
        FOREIGN KEY(category_id)
        REFERENCES document_categories(id),
	CONSTRAINT fk_documents_folder
		FOREIGN KEY(folder_id)
		REFERENCES folders(id)
		ON DELETE SET NULL
);



-- =====================================================
-- 12. TAGS
-- Java
-- Spring Boot
-- Networking
-- OOP
-- Database
-- AI
-- ...
-- =====================================================

CREATE TABLE tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tag_name VARCHAR(100) UNIQUE NOT NULL
);

-- =====================================================
-- 13. DOCUMENT TAGS
-- Many-to-Many
-- Một tài liệu có nhiều tag
-- Một tag có thể thuộc nhiều tài liệu
-- =====================================================

CREATE TABLE document_tags (
    document_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY(document_id, tag_id),
    CONSTRAINT fk_document_tags_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_tags_tag
        FOREIGN KEY(tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);

-- =====================================================
-- 14. FAVORITES
-- Bookmark tài liệu
-- User lưu tài liệu yêu thích
-- =====================================================

CREATE TABLE favorites (
    user_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, document_id),
    CONSTRAINT fk_favorites_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_favorites_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);

-- =====================================================
-- 15. COMMENTS
-- bình luận tài liệu
-- hỗ trợ thảo luận học tập
-- =====================================================

CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    parent_comment_id BIGINT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
	deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_comments_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comments_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,
	CONSTRAINT fk_comments_parent
		FOREIGN KEY(parent_comment_id)
		REFERENCES comments(id)
		ON DELETE CASCADE
);


-- =====================================================
-- 16. DOCUMENT SHARES
-- share tài liệu với bạn bè
-- =====================================================

CREATE TABLE document_shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL,
    shared_user_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    permission ENUM(
        'VIEW',
        'EDIT'
    ) DEFAULT 'VIEW',
    UNIQUE KEY uk_document_share (
		document_id,
		shared_user_id
	),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_share_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_share_owner
        FOREIGN KEY(owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_share_user
        FOREIGN KEY(shared_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- 17. DOCUMENT RATINGS
-- đánh giá tài liệu
-- rating từ 1 -> 5 sao
-- =====================================================

CREATE TABLE document_ratings (
    user_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    rating TINYINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, document_id),
    CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_document_ratings_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_ratings_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);


-- =====================================================
-- INDEXES
-- =====================================================

-- DOCUMENTS
CREATE INDEX idx_documents_user
ON documents(user_id);

CREATE INDEX idx_documents_course
ON documents(course_id);

CREATE INDEX idx_documents_category
ON documents(category_id);

CREATE INDEX idx_documents_visibility
ON documents(visibility);

CREATE INDEX idx_documents_created
ON documents(created_at);

CREATE INDEX idx_documents_rating
ON documents(average_rating);

CREATE INDEX idx_documents_views
ON documents(total_views);

CREATE INDEX idx_documents_downloads
ON documents(total_downloads);

CREATE INDEX idx_documents_moderation
ON documents(moderation_status);

-- TAGS
CREATE INDEX idx_tags_name
ON tags(tag_name);

-- DOCUMENT TAGS
CREATE INDEX idx_document_tags_tag
ON document_tags(tag_id);

-- FAVORITES
CREATE INDEX idx_favorites_document
ON favorites(document_id);

-- COMMENTS
CREATE INDEX idx_comments_document
ON comments(document_id);

CREATE INDEX idx_comments_user
ON comments(user_id);

-- RATINGS
CREATE INDEX idx_ratings_document
ON document_ratings(document_id);


-- =====================================================
-- 18. CHAT SESSIONS
--
-- Phiên làm việc với AI
--
-- Có thể gắn với:
-- - Một document cụ thể
-- - Hoặc chat tổng quát
-- =====================================================

CREATE TABLE chat_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    document_id BIGINT NULL,
    session_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_sessions_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_chat_sessions_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE SET NULL
);

-- =====================================================
-- 19. CHAT MESSAGES
-- Tin nhắn trong phiên AI
-- USER
-- AI
-- =====================================================

CREATE TABLE chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    sender_type ENUM(
        'USER',
        'AI'
    ) NOT NULL,
    message_content LONGTEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_messages_session
        FOREIGN KEY(session_id)
        REFERENCES chat_sessions(id)
        ON DELETE CASCADE
);


-- =====================================================
-- 20. REPORTS
-- Báo cáo tài liệu vi phạm
-- Spam
-- Copyright
-- Inappropriate Content
-- =====================================================

CREATE TABLE reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reporter_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    UNIQUE(reporter_id, document_id),
    report_type ENUM(
    'SPAM',
    'COPYRIGHT',
    'INAPPROPRIATE',
    'OTHER'
	) NOT NULL,
    status ENUM(
        'PENDING',
        'REVIEWING',
        'RESOLVED',
        'REJECTED'
    ) DEFAULT 'PENDING',
    report_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_reporter
        FOREIGN KEY(reporter_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_reports_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);

-- =====================================================
-- 21. DOCUMENT VIEWS
-- lịch sử xem tài liệu
-- analytics
-- popular Documents
-- =====================================================

CREATE TABLE document_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_views_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_views_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- 22. DOCUMENT DOWNLOADS
--
-- Lịch sử tải tài liệu
--
-- Dùng cho:
-- Analytics
-- Download History
-- Top Download Documents
-- Thống kê uploader
-- =====================================================

CREATE TABLE document_downloads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_downloads_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_downloads_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- 23. NOTIFICATIONS
-- Thông báo hệ thống
-- Comment
-- Report
-- AI Processing
-- =====================================================

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    notification_type ENUM(
		'COMMENT',
		'DOCUMENT',
		'REPORT',
		'SHARE',
		'SYSTEM'
	),
    is_read BOOLEAN DEFAULT FALSE,
    source_comment_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- 24. USER SUBSCRIPTIONS
-- Lưu lịch sử đăng ký gói
-- FREE
-- PRO
-- PREMIUM
-- =====================================================

CREATE TABLE user_subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    plan_version_id BIGINT NOT NULL,
    payment_id BIGINT NULL UNIQUE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    price_paid DECIMAL(12,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_subscriptions_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_subscriptions_plan
        FOREIGN KEY(plan_id)
        REFERENCES subscription_plans(id),
    CONSTRAINT fk_user_subscriptions_plan_version FOREIGN KEY(plan_version_id)
        REFERENCES subscription_plan_versions(id)
);

-- =====================================================
-- 24B. SUBSCRIPTION PAYMENTS
-- Lưu các yêu cầu nâng cấp gói đang chờ ngân hàng xác nhận
-- =====================================================

CREATE TABLE subscription_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    current_plan_id BIGINT NULL,
    target_plan_id BIGINT NOT NULL,
    current_plan_version_id BIGINT NULL,
    target_plan_version_id BIGINT NOT NULL,
    payment_code VARCHAR(64) NOT NULL UNIQUE,
    transfer_content VARCHAR(128) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    original_amount DECIMAL(12,2) NOT NULL,
    remaining_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'VND',
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    status ENUM(
        'PENDING',
        'PAID',
        'EXPIRED',
        'FAILED',
        'CANCELLED'
    ) DEFAULT 'PENDING',
    bank_name VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    qr_code_url VARCHAR(500),
    expires_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    provider_name VARCHAR(100),
    payment_mode VARCHAR(20),
    vnp_txn_ref VARCHAR(100) UNIQUE,
    vnp_transaction_no VARCHAR(100) UNIQUE,
    vnp_bank_tran_no VARCHAR(100),
    vnp_bank_code VARCHAR(30),
    vnp_card_type VARCHAR(30),
    vnp_response_code VARCHAR(10),
    vnp_transaction_status VARCHAR(10),
    vnp_pay_date VARCHAR(20),
    provider_transaction_ref VARCHAR(255) UNIQUE,
    failure_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscription_payments_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_subscription_payments_current_plan
        FOREIGN KEY(current_plan_id)
        REFERENCES subscription_plans(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_subscription_payments_target_plan
        FOREIGN KEY(target_plan_id)
        REFERENCES subscription_plans(id),
    CONSTRAINT fk_subscription_payments_current_version
        FOREIGN KEY(current_plan_version_id)
        REFERENCES subscription_plan_versions(id),
    CONSTRAINT fk_subscription_payments_target_version
        FOREIGN KEY(target_plan_version_id)
        REFERENCES subscription_plan_versions(id)
);

ALTER TABLE user_subscriptions
    ADD CONSTRAINT fk_user_subscriptions_payment
    FOREIGN KEY(payment_id) REFERENCES subscription_payments(id);



-- ====================================================================================
-- 25. DOCUMENT SUMMARIES
-- Lưu trữ nội dung tóm tắt, luận điểm chính và từ khóa cốt lõi do AI trích xuất từ file.
-- 1-1 đặc biệt với bảng `documents` thông qua ràng buộc `UNIQUE` ở trường `document_id`.
-- ====================================================================================
CREATE TABLE document_summaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                         
    document_id BIGINT NOT NULL UNIQUE,                       
    short_summary VARCHAR(1000) NOT NULL,                   
    long_summary LONGTEXT NOT NULL,                         
    key_takeaways JSON NOT NULL,                           
    tokens_used INT DEFAULT 0,                                  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,           
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    
    CONSTRAINT fk_summaries_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ====================================================================================
-- 26. AI QUIZZES
--  Quản lý thông tin chung của các bộ đề trắc nghiệm ôn tập do AI tự động tạo từ tài liệu.
--  1 tài liệu có thể sinh ra nhiều bộ đề trắc nghiệm khác nhau (1:N).
-- ====================================================================================
CREATE TABLE ai_quizzes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                        
    document_id BIGINT NOT NULL,                              
    user_id BIGINT NOT NULL,                                   
    quiz_title VARCHAR(255) NOT NULL,                            
    total_questions INT NOT NULL DEFAULT 0,                      
    difficulty_level ENUM('EASY', 'MEDIUM', 'HARD') DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,             
    
    CONSTRAINT fk_quizzes_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_quizzes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ====================================================================================
-- 27. AI QUIZ QUESTIONS
-- Lưu trữ nội dung câu hỏi, các phương án lựa chọn, đáp án đúng và lời giải thích từ AI.
-- 1 bộ đề trắc nghiệm (`ai_quizzes`) chứa nhiều câu hỏi chi tiết (1:N).
-- ====================================================================================
CREATE TABLE ai_quiz_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                         -- Khóa chính tự tăng của câu hỏi
    quiz_id BIGINT NOT NULL,                                     -- Khóa ngoại: Câu hỏi này nằm trong bộ đề trắc nghiệm nào?
    question_text TEXT NOT NULL,                                 -- Nội dung câu hỏi trắc nghiệm (Ví dụ: "Khóa ngoại dùng để làm gì?")
    option_a TEXT NOT NULL,                                      -- Nội dung phương án lựa chọn A
    option_b TEXT NOT NULL,                                      -- Nội dung phương án lựa chọn B
    option_c TEXT NOT NULL,                                      -- Nội dung phương án lựa chọn C
    option_d TEXT NOT NULL,                                      -- Nội dung phương án lựa chọn D
    correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,            -- Đáp án chính xác do AI thiết lập
    explanation TEXT,                                            -- Lời giải thích chi tiết tại sao đáp án đó đúng giúp sinh viên học hiểu bản chất
    sort_order INT DEFAULT 0,                                    -- Thứ tự sắp xếp hiển thị của câu hỏi trong bộ đề (Câu 1, Câu 2, Câu 3...)
    
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES ai_quizzes(id) ON DELETE CASCADE
);

-- ====================================================================================
-- 28. AI FLASHCARD SETS
-- Mục đích: Quản lý các bộ sưu tập thẻ ghi nhớ (Flashcard) dùng để học thuộc lòng thuật ngữ hoặc công thức định nghĩa.
-- Quan hệ: 1 tài liệu có thể tạo được nhiều bộ thẻ ghi nhớ tùy chọn (1:N).
-- ====================================================================================
CREATE TABLE ai_flashcard_sets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                        
    document_id BIGINT NOT NULL,                                 
    user_id BIGINT NOT NULL,                                     
    set_name VARCHAR(255) NOT NULL,                             
    description VARCHAR(255),                                   
    total_cards INT NOT NULL DEFAULT 0,                        
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,             
    
    CONSTRAINT fk_flashcard_sets_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_flashcard_sets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ====================================================================================
-- 29. AI FLASHCARDS
-- Lưu trữ nội dung hai mặt của từng tấm thẻ ghi nhớ (Thuật ngữ và Định nghĩa).
-- Quan hệ: 1 bộ thẻ (`ai_flashcard_sets`) chứa nhiều thẻ flashcard nhỏ bên trong (1:N).
-- ====================================================================================
CREATE TABLE ai_flashcards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,               
    set_id BIGINT NOT NULL,                       
    front_content TEXT NOT NULL,                               
    back_content TEXT NOT NULL,                                  
    sort_order INT DEFAULT 0,                                    
    
    CONSTRAINT fk_flashcards_set FOREIGN KEY (set_id) REFERENCES ai_flashcard_sets(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

-- CHAT SESSIONS
CREATE INDEX idx_chat_sessions_user
ON chat_sessions(user_id);

CREATE INDEX idx_chat_sessions_document
ON chat_sessions(document_id);

-- CHAT MESSAGES
CREATE INDEX idx_chat_messages_session
ON chat_messages(session_id);

-- REPORTS
CREATE INDEX idx_reports_document
ON reports(document_id);

CREATE INDEX idx_reports_status
ON reports(status);

CREATE INDEX idx_reports_reporter
ON reports(reporter_id);

-- DOCUMENT VIEWS
CREATE INDEX idx_document_views_document
ON document_views(document_id);

CREATE INDEX idx_document_views_user
ON document_views(user_id);

CREATE INDEX idx_document_views_time
ON document_views(viewed_at);

-- NOTIFICATIONS
CREATE INDEX idx_notifications_user
ON notifications(user_id);

CREATE INDEX idx_notifications_read
ON notifications(is_read);

CREATE INDEX idx_notifications_source_comment
ON notifications(source_comment_id);

-- USER SUBSCRIPTIONS
CREATE INDEX idx_user_subscriptions_user
ON user_subscriptions(user_id);

CREATE INDEX idx_user_subscriptions_plan
ON user_subscriptions(plan_id);

CREATE INDEX idx_user_subscriptions_active
ON user_subscriptions(is_active);

CREATE INDEX idx_subscription_payments_user
ON subscription_payments(user_id);

CREATE INDEX idx_subscription_payments_target_plan
ON subscription_payments(target_plan_id);

CREATE INDEX idx_subscription_payments_status
ON subscription_payments(status);

CREATE INDEX idx_subscription_payments_created
ON subscription_payments(created_at);

-- DOCUMENT DOWNLOAD
CREATE INDEX idx_document_downloads_document
ON document_downloads(document_id);

CREATE INDEX idx_document_downloads_user
ON document_downloads(user_id);

CREATE INDEX idx_document_downloads_time
ON document_downloads(downloaded_at);

CREATE INDEX idx_folders_user
ON folders(user_id);

CREATE INDEX idx_folders_parent
ON folders(parent_folder_id);

CREATE INDEX idx_folders_visibility
ON folders(visibility);

CREATE INDEX idx_documents_folder
ON documents(folder_id);

CREATE INDEX idx_document_shares_document
ON document_shares(document_id);

CREATE INDEX idx_document_shares_user
ON document_shares(shared_user_id);

CREATE INDEX idx_student_verification_user
ON student_verifications(user_id);

CREATE INDEX idx_student_verification_status
ON student_verifications(status);
