# Lộ trình dự án (ROADMAP.md) - AI Study Hub FPT

Bản lộ trình này theo dõi tiến độ phát triển các tính năng của dự án AI Study Hub FPT (SWP391) bao gồm những việc đã hoàn thành và chưa hoàn thành.

---

## 1. Quản lý người dùng (User Management)
- [x] Đăng ký tài khoản (Register)
- [x] Đăng nhập / Đăng xuất (Login / Logout)
- [x] Làm mới token JWT (Refresh JWT)
- [x] Quên mật khẩu & Đặt lại mật khẩu qua email (Forgot / Reset Password)
- [x] Đổi mật khẩu (Change Password)
- [x] Xem thông tin cá nhân (Profile Management)
- [ ] Xác thực email đăng ký (Email Confirmation) *[Đang phát triển]*
- [ ] Báo lỗi chi tiết khi nhập sai thông tin đăng ký (Registration Input Validation) *[Đang phát triển]*
- [ ] Gửi yêu cầu xác minh thẻ sinh viên (Student Identity Verification upload)

---

## 2. Quản lý tài liệu học tập (Document Management)
- [x] Tải lên tài liệu (Upload documents)
- [x] Tổ chức tài liệu theo thư mục lồng nhau (Folders management)
- [x] Tải xuống tài liệu (Download documents)
- [x] Xem thông tin chi tiết tài liệu & Metadata
- [ ] Tìm kiếm & Phân loại tài liệu theo Ngành học/Môn học (Search & Categorize)
- [ ] Lưu lịch sử xem tài liệu (Document view history)

---

## 3. Tính năng cộng đồng (Community Features)
- [ ] Bình luận trong tài liệu (Comments - CRUD & Threaded comments)
- [ ] Đánh giá tài liệu (Ratings 1-5 stars)
- [ ] Thêm tài liệu vào danh sách yêu thích (Favorites / Bookmarks)
- [ ] Chia sẻ quyền xem/sửa tài liệu với người dùng khác (Document Sharing)
- [ ] Báo cáo tài liệu vi phạm quy chuẩn (Report content)

---

## 4. Trợ lý học tập AI (AI Assistant Features)
- [x] Tóm tắt tài liệu tự động (Short/Long Summary, Key Takeaways)
- [x] Tạo bộ câu hỏi trắc nghiệm ôn tập tự động (Quiz Generation - EASY, MEDIUM, HARD)
- [x] Tạo bộ thẻ ghi nhớ tự động (Flashcard Set Generation)
- [ ] Trò chuyện trực tiếp với AI Chatbot (Contextual Chat with AI) *[Đang phát triển]*
- [ ] Trò chuyện có ngữ cảnh của tài liệu được chọn (Contextual chat using specific document content) *[Đang phát triển]*

---

## 5. Thanh toán & Gói dịch vụ (Subscription & Payment)
- [ ] Xem danh sách các gói dịch vụ (FREE, PRO, PREMIUM)
- [ ] Mua gói nâng cấp dung lượng & lượt dùng AI qua cổng thanh toán (VNPay / Stripe)
- [ ] Quản lý lịch sử giao dịch & thời hạn gói (Billing History & Active Subscriptions)

---

## 6. Trang quản trị viên (Admin Portal Features)
- [ ] Quản lý người dùng (Ban / Unban / Xem danh sách)
- [ ] Duyệt yêu cầu xác minh danh tính sinh viên (Approve / Reject Student Verifications)
- [ ] Duyệt / Từ chối / Gỡ bỏ tài liệu (Document moderation)
- [ ] Xử lý báo cáo vi phạm nội dung (Manage reports)
- [ ] Quản lý cấu hình hệ thống (Majors, Courses, Categories, Subscription Plans)

---

## 7. Giao diện người dùng (Frontend App)
- [x] Khởi tạo dự án ReactJS + Vite + TailwindCSS
- [ ] Xây dựng luồng Đăng ký / Đăng nhập / Xác nhận email
- [ ] Xây dựng trang Dashboard quản lý tài liệu & thư mục
- [ ] Xây dựng giao diện xem tài liệu tích hợp AI (Summary, Quiz, Flashcard, Chatbot)
- [ ] Xây dựng trang nâng cấp gói và cổng thanh toán
- [ ] Xây dựng Dashboard cho Admin
