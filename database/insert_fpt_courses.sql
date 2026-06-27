-- =====================================================
-- FPT University Courses - Insert Script
-- Using INSERT IGNORE to skip existing course_codes
-- Already existing: CSD201, DBI202, MAS291, PRF192, PRO192, SWP391
-- =====================================================

USE ai_studyhub;

INSERT IGNORE INTO courses (course_code, course_name, description, is_active) VALUES
-- === INFORMATION TECHNOLOGY ===
('CSI104', 'Introduction to Computer Science', 'Nhập môn Khoa học Máy tính - Giới thiệu các khái niệm cơ bản về khoa học máy tính', true),
('MAD101', 'Discrete Mathematics', 'Toán rời rạc - Nền tảng toán học cho khoa học máy tính', true),
('MAS291', 'Statistics & Probability', 'Xác suất và Thống kê ứng dụng trong công nghệ phần mềm', true),
('SSL101c', 'Student Success Skills', 'Kỹ năng học tập và phát triển bản thân cho sinh viên', true),
('VOV101', 'Vovinam', 'Võ Việt Nam - Môn thể chất bắt buộc', true),
('ENT101', 'Entrepreneurship', 'Khởi nghiệp - Kiến thức và kỹ năng khởi nghiệp', true),
('PRF192', 'Programming Fundamentals', 'Cơ sở lập trình - Nền tảng lập trình với ngôn ngữ C', true),
('PRO192', 'Object-Oriented Programming', 'Lập trình hướng đối tượng với Java', true),
('LAB211', 'OOP with Java Lab', 'Thực hành lập trình hướng đối tượng với Java', true),
('CSD201', 'Data Structures and Algorithms', 'Cấu trúc dữ liệu và Giải thuật', true),
('WED201c', 'Web Design', 'Thiết kế Web - HTML, CSS và JavaScript cơ bản', true),
('PRM392', 'Mobile Programming', 'Lập trình di động - Phát triển ứng dụng Android/iOS', true),
('DBI202', 'Introduction to Database', 'Nhập môn Cơ sở dữ liệu - SQL và thiết kế database', true),
('OSG202', 'Operating Systems', 'Hệ điều hành - Nguyên lý và quản lý tài nguyên hệ thống', true),
('NWC203', 'Computer Networking', 'Mạng máy tính - Giao thức và kiến trúc mạng', true),
('SWE201c', 'Introduction to Software Engineering', 'Nhập môn Công nghệ phần mềm', true),
('ITE302c', 'Ethics in IT', 'Đạo đức trong Công nghệ thông tin', true),
('SWR302', 'Software Requirements', 'Yêu cầu phần mềm - Phân tích và đặc tả yêu cầu', true),
('SWD391', 'Software Design', 'Thiết kế phần mềm - Design patterns và kiến trúc phần mềm', true),
('SWT301', 'Software Testing', 'Kiểm thử phần mềm - Kỹ thuật và công cụ testing', true),
('SWP391', 'Software Development Project', 'Đồ án phát triển phần mềm - Dự án thực tế', true),
('PMG201c', 'Project Management', 'Quản lý dự án - Phương pháp và công cụ quản lý', true),
('PMG202c', 'Advanced Project Management', 'Quản lý dự án nâng cao', true),
('ITA301', 'Information System Analysis & Design', 'Phân tích và Thiết kế Hệ thống thông tin', true),
('ISP392', 'Information System Programming', 'Lập trình Hệ thống thông tin', true),
('BPS301', 'Business Process Systems', 'Hệ thống quy trình nghiệp vụ', true),
('DSS301', 'Decision Support Systems', 'Hệ thống hỗ trợ ra quyết định', true),
('KMS301', 'Knowledge Management Systems', 'Hệ thống quản lý tri thức', true),
('DTA301', 'Data Analytics', 'Phân tích dữ liệu', true),
('MLP301', 'Machine Learning', 'Học máy - Thuật toán và ứng dụng machine learning', true),
('AIL301', 'Artificial Intelligence', 'Trí tuệ nhân tạo - AI fundamentals và ứng dụng', true),
('DLP301', 'Deep Learning', 'Học sâu - Neural networks và deep learning', true),
('SAP311', 'SAP General', 'SAP cơ bản - Hệ thống hoạch định nguồn lực doanh nghiệp', true),
('SAP321', 'SAP Advanced', 'SAP nâng cao', true),

-- === JAPANESE LANGUAGE ===
('JPD111', 'Japanese Elementary 1', 'Tiếng Nhật cơ sở 1', true),
('JPD112', 'Japanese Elementary 2', 'Tiếng Nhật cơ sở 2', true),
('JPD113', 'Japanese Elementary 3', 'Tiếng Nhật cơ sở 3', true),
('JPD121', 'Japanese Intermediate 1', 'Tiếng Nhật trung cấp 1', true),
('JPD123', 'Japanese Intermediate 2', 'Tiếng Nhật trung cấp 2', true),

-- === CAPSTONE ===
('SEP490', 'Capstone Project', 'Đồ án tốt nghiệp - Dự án cuối khóa', true),

-- === BUSINESS ADMINISTRATION ===
('MGT101', 'Principles of Management', 'Nguyên lý quản trị - Nền tảng quản trị kinh doanh', true),
('MKT101', 'Principles of Marketing', 'Nguyên lý Marketing', true),
('ECO201', 'Microeconomics', 'Kinh tế vi mô', true),
('ECO202', 'Macroeconomics', 'Kinh tế vĩ mô', true),
('ACC101', 'Financial Accounting', 'Kế toán tài chính', true),
('ACC201', 'Management Accounting', 'Kế toán quản trị', true),
('BUS201', 'Business Environment', 'Môi trường kinh doanh', true),
('BUS301', 'Business Ethics', 'Đạo đức kinh doanh', true),
('LAW101', 'Business Law', 'Luật kinh doanh', true),

-- === MARKETING ===
('MKT201', 'Consumer Behavior', 'Hành vi người tiêu dùng', true),
('MKT202', 'Marketing Research', 'Nghiên cứu Marketing', true),
('MKT301', 'Brand Management', 'Quản trị thương hiệu', true),
('MKT304', 'Integrated Marketing Communications', 'Truyền thông Marketing tích hợp', true),
('MKT308', 'Digital Marketing', 'Marketing số', true),
('MKT401', 'Strategic Marketing', 'Marketing chiến lược', true),
('MKT402', 'Services Marketing', 'Marketing dịch vụ', true),
('MKT403', 'International Marketing', 'Marketing quốc tế', true),

-- === DIGITAL MARKETING ===
('DMS301m', 'Digital Marketing Strategy', 'Chiến lược Marketing số', true),
('SEO301', 'Search Engine Optimization', 'Tối ưu hóa công cụ tìm kiếm', true),
('SEM302', 'Search Engine Marketing', 'Marketing trên công cụ tìm kiếm', true),
('SMM303', 'Social Media Marketing', 'Marketing trên mạng xã hội', true),
('CON304', 'Content Marketing', 'Marketing nội dung', true),
('CRM305', 'Customer Relationship Management', 'Quản trị quan hệ khách hàng', true),
('ECOM306', 'E-Commerce Marketing', 'Marketing thương mại điện tử', true),
('ANA307', 'Marketing Analytics', 'Phân tích Marketing', true),

-- === INTERNATIONAL BUSINESS ===
('IB301', 'International Business', 'Kinh doanh quốc tế', true),
('IB302', 'International Trade', 'Thương mại quốc tế', true),
('IB303', 'Global Business Environment', 'Môi trường kinh doanh toàn cầu', true),
('IB304', 'International Finance', 'Tài chính quốc tế', true),
('IB305', 'Cross-Cultural Management', 'Quản trị đa văn hóa', true),
('IB306', 'International Logistics', 'Logistics quốc tế', true),

-- === BUSINESS ANALYTICS ===
('BA301', 'Business Analytics', 'Phân tích kinh doanh', true),
('BA302', 'Business Intelligence', 'Trí tuệ kinh doanh', true),
('BA303', 'Data Visualization', 'Trực quan hóa dữ liệu', true),
('BA304', 'Predictive Analytics', 'Phân tích dự đoán', true),
('BA305', 'Decision Making Models', 'Mô hình ra quyết định', true),
('BA306', 'Data-Driven Business', 'Kinh doanh dựa trên dữ liệu', true),

-- === SUPPLY CHAIN MANAGEMENT ===
('SCM301', 'Supply Chain Management', 'Quản trị chuỗi cung ứng', true),
('SCM302', 'Procurement Management', 'Quản trị mua hàng', true),
('SCM303', 'Inventory Management', 'Quản trị hàng tồn kho', true),
('SCM304', 'Transportation Management', 'Quản trị vận tải', true),
('SCM305', 'Warehouse Management', 'Quản trị kho', true),
('SCM306', 'Global Logistics', 'Logistics toàn cầu', true),

-- === FINANCE ===
('FIN201', 'Corporate Finance', 'Tài chính doanh nghiệp', true),
('FIN301', 'Financial Markets', 'Thị trường tài chính', true),
('FIN302', 'Investment Analysis', 'Phân tích đầu tư', true),
('FIN303', 'Financial Technology', 'Công nghệ tài chính - FinTech', true),
('FIN304', 'Digital Banking', 'Ngân hàng số', true),
('FIN305', 'Blockchain Applications', 'Ứng dụng Blockchain', true),
('FIN306', 'AI in Finance', 'Trí tuệ nhân tạo trong tài chính', true),

-- === HOSPITALITY & TOURISM ===
('HOS301', 'Hospitality Management', 'Quản trị khách sạn', true),
('HOS302', 'Hotel Operations', 'Vận hành khách sạn', true),
('HOS303', 'Food & Beverage Management', 'Quản trị Ẩm thực và Đồ uống', true),
('TOU301', 'Tourism Management', 'Quản trị du lịch', true),
('TOU302', 'Tour Operations', 'Vận hành tour du lịch', true),
('EVT301', 'Event Management', 'Quản trị sự kiện', true),

-- === BANKING ===
('BAN301', 'Commercial Banking', 'Ngân hàng thương mại', true),
('BAN302', 'Risk Management', 'Quản trị rủi ro', true),
('BAN303', 'Financial Planning', 'Lập kế hoạch tài chính', true),
('FIN401', 'Investment Portfolio', 'Danh mục đầu tư', true),
('FIN402', 'Financial Risk Analysis', 'Phân tích rủi ro tài chính', true),

-- === ENGLISH LANGUAGE ===
('ENG101', 'English Foundation 1', 'Tiếng Anh nền tảng 1', true),
('ENG102', 'English Foundation 2', 'Tiếng Anh nền tảng 2', true),
('ENG103', 'English Foundation 3', 'Tiếng Anh nền tảng 3', true),
('ENG104', 'English Foundation 4', 'Tiếng Anh nền tảng 4', true),
('ENG105', 'English Foundation 5', 'Tiếng Anh nền tảng 5', true),
('ENG106', 'English Foundation 6', 'Tiếng Anh nền tảng 6', true),
('ENS201', 'Listening Skills', 'Kỹ năng Nghe tiếng Anh', true),
('ENS202', 'Speaking Skills', 'Kỹ năng Nói tiếng Anh', true),
('ENS203', 'Reading Skills', 'Kỹ năng Đọc tiếng Anh', true),
('ENS204', 'Writing Skills', 'Kỹ năng Viết tiếng Anh', true),
('ENS301', 'Academic Writing', 'Viết học thuật', true),
('ENS302', 'Academic Reading', 'Đọc hiểu học thuật', true),
('ENS303', 'Research Methodology', 'Phương pháp nghiên cứu', true),
('ENS304', 'Linguistics', 'Ngôn ngữ học', true),
('ENS401', 'Translation Theory', 'Lý thuyết dịch thuật', true),
('ENS402', 'Translation Practice', 'Thực hành dịch thuật', true),
('ENS403', 'Interpretation Skills', 'Kỹ năng phiên dịch', true),
('ENS404', 'Advanced Interpretation', 'Phiên dịch nâng cao', true),
('ENS501', 'Business Communication', 'Giao tiếp kinh doanh', true),
('ENS502', 'English for Business', 'Tiếng Anh thương mại', true),
('ENS503', 'International Communication', 'Giao tiếp quốc tế', true),

-- === CHINESE LANGUAGE ===
('CHN101', 'Chinese Foundation 1', 'Tiếng Trung nền tảng 1', true),
('CHN102', 'Chinese Foundation 2', 'Tiếng Trung nền tảng 2', true),
('CHN103', 'Chinese Foundation 3', 'Tiếng Trung nền tảng 3', true),
('CHN104', 'Chinese Foundation 4', 'Tiếng Trung nền tảng 4', true),
('CHN201', 'Chinese Listening', 'Kỹ năng Nghe tiếng Trung', true),
('CHN202', 'Chinese Speaking', 'Kỹ năng Nói tiếng Trung', true),
('CHN203', 'Chinese Reading', 'Kỹ năng Đọc tiếng Trung', true),
('CHN204', 'Chinese Writing', 'Kỹ năng Viết tiếng Trung', true),
('CHN301', 'Chinese Translation', 'Dịch thuật tiếng Trung', true),
('CHN302', 'Chinese Interpretation', 'Phiên dịch tiếng Trung', true),
('CHN303', 'Chinese Linguistics', 'Ngôn ngữ học tiếng Trung', true),
('CHN304', 'Chinese Culture', 'Văn hóa Trung Quốc', true),
('CHN401', 'Business Chinese', 'Tiếng Trung thương mại', true),
('CHN402', 'Chinese Trade Communication', 'Giao tiếp thương mại tiếng Trung', true),
('CHN403', 'Chinese for International Business', 'Tiếng Trung kinh doanh quốc tế', true),

-- === KOREAN LANGUAGE ===
('KOR101', 'Korean Foundation 1', 'Tiếng Hàn nền tảng 1', true),
('KOR102', 'Korean Foundation 2', 'Tiếng Hàn nền tảng 2', true),
('KOR103', 'Korean Foundation 3', 'Tiếng Hàn nền tảng 3', true),
('KOR104', 'Korean Foundation 4', 'Tiếng Hàn nền tảng 4', true),
('KOR201', 'Korean Listening', 'Kỹ năng Nghe tiếng Hàn', true),
('KOR202', 'Korean Speaking', 'Kỹ năng Nói tiếng Hàn', true),
('KOR203', 'Korean Reading', 'Kỹ năng Đọc tiếng Hàn', true),
('KOR204', 'Korean Writing', 'Kỹ năng Viết tiếng Hàn', true),
('KOR301', 'Korean Linguistics', 'Ngôn ngữ học tiếng Hàn', true),
('KOR302', 'Korean Translation', 'Dịch thuật tiếng Hàn', true),
('KOR303', 'Korean Interpretation', 'Phiên dịch tiếng Hàn', true),
('KOR304', 'Korean Culture', 'Văn hóa Hàn Quốc', true),
('KOR401', 'Business Korean', 'Tiếng Hàn thương mại', true),
('KOR402', 'Korean Corporate Culture', 'Văn hóa doanh nghiệp Hàn Quốc', true),
('KOR403', 'Korean Business Communication', 'Giao tiếp kinh doanh tiếng Hàn', true),

-- === OTHER ===
('COM301', 'Cross-Cultural Communication', 'Giao tiếp đa văn hóa', true),
('INT301', 'International Relations', 'Quan hệ quốc tế', true),
('RES301', 'Research Methodology', 'Phương pháp nghiên cứu khoa học', true),
('TES301', 'Language Teaching Methodology', 'Phương pháp giảng dạy ngôn ngữ', true);

-- Show summary
SELECT CONCAT('Total courses in database: ', COUNT(*)) AS summary FROM courses;
