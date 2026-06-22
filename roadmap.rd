# LỘ TRÌNH DỰ ÁN (ROADMAP) - AI STUDY HUB FPT

Tài liệu này tổng hợp chi tiết các tính năng, nhiệm vụ đã hoàn thành (DONE) và các định hướng, tính năng chưa hoàn thành / cần phát triển tiếp theo (TODO) của dự án hệ thống chia sẻ học liệu thông minh **AI Study Hub FPT (SWP391)**.

---

## I. NHỮNG GÌ ĐÃ LÀM (DONE)

Hệ thống hiện tại đã xây dựng hoàn chỉnh cả phần **Backend (Spring Boot)**, **Database (MySQL)** và **Frontend (ReactJS + TailwindCSS)** với các nhóm tính năng cốt lõi sau:

### 1. Quản lý người dùng (User Management)
*   **Đăng ký & Xác thực**: Luồng đăng ký tài khoản mới tích hợp kiểm tra định dạng email sinh viên FPT (`@fpt.edu.vn` hoặc `@fe.edu.vn`).
*   **Đăng nhập & Bảo mật**: Cơ chế xác thực sử dụng JWT Token (bao gồm Access Token thời hạn ngắn và Refresh Token để duy trì trạng thái đăng nhập).
*   **Xác thực tài khoản (Email Confirmation)**: Gửi link kích hoạt tài khoản qua email khi đăng ký thành công.
*   **Quên & Đặt lại mật khẩu**: Hỗ trợ đặt lại mật khẩu an toàn qua mã xác minh gửi tới email của người dùng.
*   **Quản lý thông tin cá nhân (Profile)**: Xem và cập nhật thông tin cá nhân của người dùng.
*   **Xác minh danh tính sinh viên**: Chức năng tải ảnh thẻ sinh viên lên hệ thống để gửi yêu cầu phê duyệt tài khoản sinh viên chính thức.

### 2. Quản lý tài liệu học tập (Document Management)
*   **Tải lên tài liệu (Upload)**: Hỗ trợ đăng tải các định dạng học liệu như PDF, Word, PowerPoint, và các file nén (.zip, .rar).
*   **Tổ chức thư mục (Folders)**: Cho phép người dùng tạo cấu trúc thư mục lồng nhau để quản lý tài liệu cá nhân khoa học.
*   **Xem trực tuyến (Preview)**:
    *   Tài liệu PDF được hiển thị trực tiếp thông qua trình xem PDF tích hợp.
    *   Tài liệu văn phòng (.docx, .pptx) được tích hợp hiển thị qua Google Docs Viewer (ở môi trường production/cloud) hoặc có nút tải về khi chạy local.
*   **Tải xuống tài liệu (Download)**: Tải tài liệu về thiết bị cá nhân.
*   **Phân loại & Bộ lọc**: Quản lý và lọc tài liệu theo Ngành học (Major), Môn học (Course), các thẻ tag tự định nghĩa và Danh mục (Category).
*   **Lịch sử & Tìm kiếm**: Lưu vết lịch sử xem tài liệu của người dùng; công cụ tìm kiếm tài liệu theo từ khóa tối ưu.

### 3. Tính năng cộng đồng & Tương tác (Community Features)
*   **Bình luận thảo luận**: Hỗ trợ viết bình luận dưới mỗi tài liệu, hỗ trợ hiển thị dạng cây lồng ghép nhiều cấp (Threaded Comments) giúp thảo luận nhóm dễ dàng.
*   **Đánh giá (Rating)**: Cho phép người dùng đánh giá chất lượng tài liệu từ 1 đến 5 sao.
*   **Yêu thích (Favorites/Bookmarks)**: Đánh dấu lưu trữ các tài liệu hay vào danh sách yêu thích cá nhân.
*   **Chia sẻ tài liệu (Sharing)**: Chia sẻ quyền xem hoặc chỉnh sửa tài liệu với người dùng cụ thể trong hệ thống.
*   **Báo cáo vi phạm (Report/Flag)**: Người dùng có thể báo cáo các tài liệu có nội dung không phù hợp lên ban quản trị.

### 4. Trợ lý học tập AI (AI Assistant Features)
*   **Tích hợp Gemini AI**: Tận dụng Google Gemini API để xử lý và phản hồi ngôn ngữ tự nhiên theo tài liệu.
*   **Tóm tắt tự động (AI Summary)**: Trích xuất nội dung chính từ tài liệu thành 3 phần: Tóm tắt ngắn (Short Summary), Tóm tắt chi tiết (Detailed Summary) và các Điểm chính (Key Takeaways). Cho phép tải file tóm tắt dưới dạng văn bản (.txt) và chỉnh kích thước chữ.
*   **Thẻ ghi nhớ thông minh (AI Flashcards)**: Tự động phân tích tài liệu và tạo bộ Flashcard tương ứng. Cung cấp giao diện trực quan hỗ trợ lật thẻ (Question/Answer) để học bài nhanh.
*   **Bộ câu hỏi ôn tập (AI Quiz)**: Tạo bài kiểm tra trắc nghiệm theo 3 mức độ (Dễ, Trung bình, Khó) dựa trên nội dung tài liệu. Sinh viên làm bài trực tiếp, hệ thống tự động chấm điểm và hiển thị giải thích chi tiết cho từng đáp án.
*   **Trò chuyện ngữ cảnh (Contextual Chat)**: Chat trực tiếp với trợ lý AI Tutor dựa trên toàn bộ nội dung của tài liệu đang đọc, đi kèm các câu hỏi gợi ý nhanh để bắt đầu.

### 5. Gói cước dịch vụ & Thanh toán (Subscription & Payment)
*   **Xem gói dịch vụ**: Hiển thị bảng giá các gói FREE, PRO, PREMIUM với các giới hạn về dung lượng và lượt sử dụng AI.
*   **Nâng cấp gói qua VietQR Mock**: Tạo mã VietQR chuyển khoản giả lập chứa đầy đủ thông tin chuyển khoản ngân hàng và cú pháp nâng cấp gói.
*   **Quản lý giao dịch**: Xem lịch sử thanh toán hóa đơn (Billing History) và thời hạn sử dụng của gói cước đang hoạt động.

### 6. Trang quản trị viên (Admin Portal Features)
*   **Bảng điều khiển thống kê (Overview Dashboard)**: Theo dõi biểu đồ tăng trưởng người dùng, số lượng tài liệu, lượt tải và tần suất tương tác với AI.
*   **Quản trị tài khoản**: Xem thông tin chi tiết, thực hiện khóa (Ban) hoặc mở khóa (Unban) người dùng vi phạm quy chế.
*   **Phê duyệt thẻ sinh viên**: Xem và duyệt/từ chối các yêu cầu xác minh danh tính của sinh viên dựa trên ảnh thẻ đã tải lên.
*   **Kiểm duyệt tài liệu**: Duyệt tài liệu mới tải lên trước khi hiển thị công khai, hoặc gỡ bỏ tài liệu vi phạm.
*   **Xử lý báo cáo vi phạm**: Tiếp nhận và đưa ra quyết định xử lý đối với các báo cáo nội dung xấu từ cộng đồng.
*   **Quản lý cấu hình**: Cập nhật danh sách Ngành học, Môn học, Danh mục tài liệu và các cấu hình chung của hệ thống.
*   **Giám sát hệ thống**: Quản lý dung lượng lưu trữ Cloud (Firebase), theo dõi danh sách các tệp tin có dung lượng lớn nhất và nhật ký hoạt động hệ thống (System Activity Logs).

---

## II. NHỮNG GÌ CHƯA LÀM & ĐỊNH HƯỚNG PHÁT TRIỂN (TODO)

Để hệ thống hoàn thiện hơn và sẵn sàng đưa vào vận hành thực tế ở quy mô lớn, các tính năng và cải tiến sau cần được nghiên cứu và triển khai tiếp theo:

### 1. Tích hợp cổng thanh toán thực tế (Real Payment Integration)
*   **Mô tả**: Thay thế luồng VietQR Mock hiện tại bằng cổng thanh toán thật.
*   **Giải pháp**: Tích hợp API/Webhook của các cổng thanh toán như **PayOS**, **Momo**, **ZaloPay** hoặc **VNPAY**. Khi người dùng quét mã chuyển tiền thành công, hệ thống tự động nhận tín hiệu Webhook từ cổng thanh toán để tự động kích hoạt/nâng cấp gói dịch vụ mà không cần Admin duyệt thủ công.

### 2. Tìm kiếm thông minh bằng Vector (Vector / Semantic Search)
*   **Mô tả**: Nâng cấp công cụ tìm kiếm tài liệu từ khớp từ khóa thông thường sang tìm kiếm theo ý nghĩa và ngữ cảnh của câu hỏi.
*   **Giải pháp**: Sử dụng mô hình Embedding của OpenAI/Gemini để chuyển đổi nội dung tài liệu thành các vector số, lưu trữ vào Vector Database như **pgvector** (trong PostgreSQL), **Qdrant**, hoặc **Milvus**. Cho phép tìm kiếm tài liệu chính xác hơn ngay cả khi người dùng không gõ đúng từ khóa có sẵn.

### 3. Hệ thống gợi ý học tập (Recommendation Engine)
*   **Mô tả**: Gợi ý các tài liệu liên quan hoặc các môn học mà sinh viên có thể muốn học tiếp theo dựa trên hành vi sử dụng.
*   **Giải pháp**: Phát triển thuật toán gợi ý (như Collaborative Filtering hoặc Content-based Filtering) dựa trên lịch sử xem, lịch sử tải xuống, ngành học và các tài liệu được đánh giá cao bởi các sinh viên khác cùng ngành.

### 4. Biểu đồ tiến độ và phân tích học tập (Learning Analytics Dashboard)
*   **Mô tả**: Cung cấp cho sinh viên một không gian cá nhân hóa để theo dõi hiệu suất học tập của bản thân.
*   **Giải pháp**: Xây dựng biểu đồ thống kê: số câu hỏi trắc nghiệm đã trả lời đúng, tỷ lệ hoàn thành bộ flashcard, thời gian dành ra để đọc tài liệu, và lịch sử điểm số của các bài kiểm tra AI Quiz để người dùng tự đánh giá tiến trình học.

### 5. Thông báo thời gian thực (Real-time Notifications)
*   **Mô tả**: Gửi thông báo ngay lập tức tới người dùng khi có sự kiện mới phát sinh trên hệ thống.
*   **Giải pháp**: Sử dụng công nghệ **WebSockets** hoặc **Firebase Cloud Messaging (FCM)** để đẩy thông báo lập tức (Push Notification) khi: tài liệu cá nhân được admin phê duyệt, có ai đó phản hồi bình luận của bạn, hoặc có tài liệu mới thuộc môn học bạn đang theo dõi.

### 6. Cải tiến hạ tầng gửi email tự động (Production Email Service)
*   **Mô tả**: Đảm bảo email xác thực và email đặt lại mật khẩu được gửi đi nhanh chóng, không bị đánh dấu là thư rác (Spam).
*   **Giải pháp**: Cấu hình sử dụng các dịch vụ gửi thư chuyên nghiệp như **Amazon SES (Simple Email Service)**, **SendGrid**, hoặc **Mailgun**, thay vì sử dụng Gmail SMTP cá nhân có giới hạn số lượng và độ tin cậy thấp.

### 7. Ứng dụng di động (Mobile Application)
*   **Mô tả**: Giúp sinh viên tiếp cận kho tài liệu học tập và học bài dễ dàng mọi lúc mọi nơi trên điện thoại thông minh.
*   **Giải pháp**: Phát triển ứng dụng đa nền tảng bằng **React Native** hoặc **Flutter**, tập trung tối ưu hóa trải nghiệm học qua Flashcard, làm AI Quiz và chat với AI Tutor trên giao diện màn hình dọc di động.

### 8. Đồng bộ hóa lịch sử Chat AI lâu dài (AI Chat History Persistence)
*   **Mô tả**: Lưu trữ vĩnh viễn các phiên chat của sinh viên với trợ lý AI Tutor vào cơ sở dữ liệu.
*   **Giải pháp**: Lưu các đoạn hội thoại trực tiếp vào bảng `chat_sessions` và `chat_messages` trong MySQL (thay vì lưu tạm thời trong trạng thái UI ở client), hỗ trợ sinh viên mở lại và xem tiếp các thắc mắc trước đây bất cứ lúc nào.
