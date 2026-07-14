# AI StudyHub — Backend

Spring Boot 3 · Java 21 · MySQL · Firebase Storage · Gemini AI

## Prerequisites
- Java 21
- Maven 3.9+
- MySQL 8.0+
- IntelliJ IDEA (recommended)

## Setup

### 1. Clone & open in IntelliJ
```
File → Open → chọn thư mục ai-studyhub-backend
```
IntelliJ tự nhận Maven project và download dependencies.

### 2. Tạo database
```sql
CREATE DATABASE ai_studyhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Chạy file `database/schema.sql` để tạo tables.

### 3. Cấu hình environment variables
Trong IntelliJ: Run → Edit Configurations → Environment variables:
```
DB_USERNAME=root
DB_PASSWORD=root123
JWT_SECRET=your-256-bit-secret
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_SERVICE_ACCOUNT_PATH=src/main/resources/firebase-service-account.json
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
```

### 4. Thêm Firebase service account
Tải file JSON từ Firebase Console → Project Settings → Service Accounts
→ Đặt tại: `src/main/resources/firebase-service-account.json`

### 5. Chạy với profile dev
```
Run → Edit Configurations → Active profiles: dev
```
Hoặc: `mvn spring-boot:run -Dspring-boot.run.profiles=dev`

Khi chạy profile `dev`, ứng dụng tự seed một tài khoản demo nếu tài khoản chưa tồn tại:
```text
Email: demo@studyhub.local
Password: StudyHub@123
```
Có thể đổi bằng biến môi trường `DEMO_ACCOUNT_EMAIL` và `DEMO_ACCOUNT_PASSWORD`.

Tài khoản admin dev:
```text
Email: admin@studyhub.local
Password: Admin@123
```
Có thể đổi bằng biến môi trường `DEMO_ADMIN_EMAIL` và `DEMO_ADMIN_PASSWORD`.

### 6. Truy cập Swagger UI
```
http://localhost:8080/swagger-ui.html
```

## Project structure
```
src/main/java/com/studyhub/
├── config/          Cấu hình Spring Security, CORS, Firebase, Gemini
├── common/          ApiResponse, PageResponse, GlobalExceptionHandler, Enums
├── security/        JWT filter, token provider, UserDetails
├── user/            Auth & profile (entity, repo, dto, service, controller)
├── document/        Document management
├── storage/         Firebase Storage integration
├── chat/            AI chatbot với Gemini
└── admin/           Admin panel
```

## API Documentation
Xem đầy đủ tại `/swagger-ui.html` sau khi chạy project.
