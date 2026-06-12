export const appUser = {
  initials: 'SV',
  name: 'Nguyễn Văn A',
  email: 'student@fpt.edu.vn',
  city: 'Hà Nội, Việt Nam',
  joined: 'Tham gia từ tháng 1, 2024',
  notifications: 3,
}

export const guestUser = {
  initials: '?',
  name: 'Khách',
  email: 'Chưa đăng nhập',
  notifications: 0,
}

export const defaultStudyFile = {
  name: '漢字--JPD316 Lesson 5-NEW.pptx',
  attachmentName: 'BTVN-BAI_PART3.docx',
  subject: 'Japanese',
  content: '',
}

export const mainNavItems = [
  { id: 'home', label: 'Trang chủ', icon: 'home' },
  { id: 'explore', label: 'Khám phá', icon: 'compass' },
  { id: 'library', label: 'Tài liệu của tôi', icon: 'folder' },
  { id: 'upload', label: 'Tải lên', icon: 'upload' },
  { id: 'profile', label: 'Hồ sơ', icon: 'user' },
]

export const publicNavItems = [
  { id: 'guest-home', label: 'Trang chủ', icon: 'home' },
  { id: 'explore', label: 'Khám phá', icon: 'compass' },
]

export const popularCourses = ['CEA201', 'PRF192', 'DBI202', 'SWP391', 'PRO192']

export const majors = ['SE', 'AI', 'IA', 'SS', 'GD']

export const stats = [
  { id: 'documents', value: '1,234', label: 'Tài liệu', icon: 'book', tone: 'blue' },
  { id: 'downloads', value: '45,678', label: 'Lượt tải', icon: 'download', tone: 'green' },
  { id: 'students', value: '567', label: 'Sinh viên', icon: 'sparkle', tone: 'purple' },
]

export const featuredFolders = [
  {
    code: 'PRF192',
    date: '28/5/2024',
    title: 'PRF192 - Programming Fundamentals Full Pack',
    description: 'Bộ tài liệu hoàn chỉnh PRF192: Slides bài giảng, Source code mẫu, Đề thi + Đáp án',
    files: 22,
    downloads: '5,678',
    author: 'Trần Thị B',
  },
  {
    code: 'SWP391',
    date: '16/5/2024',
    title: 'SWP391 - Project Templates & Guides',
    description: 'Template dự án SWP391 đầy đủ: Spring Boot, React, Documentation, Presentation slides',
    files: 12,
    downloads: '4,320',
    author: 'Phạm Văn D',
  },
  {
    code: 'CEA201',
    date: '10/5/2024',
    title: 'CEA201 - Complete Course Materials',
    description: 'Tổng hợp tài liệu đầy đủ môn CEA201: Slides, Labs, Assignments, và đề thi các kỳ',
    files: 15,
    downloads: '3,245',
    author: 'Nguyễn Văn A',
  },
  {
    code: 'DBI202',
    date: '10/5/2024',
    title: 'DBI202 - Database Lab Solutions',
    description: 'Lời giải chi tiết tất cả Lab DBI202, kèm SQL scripts và giải thích',
    files: 8,
    downloads: '1,890',
    author: 'Lê Kim C',
    active: true,
  },
  {
    code: 'PRO192',
    date: '20/4/2024',
    title: 'PRO192 - OOP Java Complete Guide',
    description: 'Tài liệu OOP Java từ cơ bản đến nâng cao: Theory, Practice, Design Patterns',
    files: 18,
    downloads: '4,156',
    author: 'Hoàng Thị E',
  },
  {
    code: 'CSD201',
    date: '6/5/2024',
    title: 'CSD201 - Data Structures & Algorithms Pack',
    description: 'Bộ tài liệu CSD201: Slides lý thuyết, Code Implementation, Practice problems',
    files: 20,
    downloads: '3,890',
    author: 'Vũ Văn F',
  },
  {
    code: 'IAO201c',
    date: '25/4/2024',
    title: 'IAO201c - Network Security Resources',
    description: 'Tài liệu bảo mật mạng: Slides, Labs, Tools, và case studies thực tế',
    files: 10,
    downloads: '1,234',
    author: 'Trần Văn G',
  },
]

export const featuredDocuments = [
  {
    code: 'PRF192',
    type: 'Exam',
    title: 'PRF192 - Final Exam 2023',
    description: 'Previous year final exam with solutions and detailed explanations',
    downloads: '2,156',
    views: '5,390',
    rating: '4.9',
    date: '10/5/2024',
    subject: 'Programming Fundamentals',
    uploader: 'Tran Thi B',
  },
  {
    code: 'SWP391',
    type: 'Source Code',
    title: 'SWP391 - Project Source Code Template',
    description: 'Complete Spring Boot + React template for final project with authentication and CRUD operations',
    downloads: '1,532',
    views: '3,830',
    rating: '4.6',
    date: '20/5/2024',
    subject: 'Software Development Project',
    uploader: 'Pham Van D',
  },
  {
    code: 'CEA201',
    type: 'Slide',
    title: 'CEA201 - Chapter 1: Computer Architecture Overview',
    description: 'Comprehensive slide deck covering basic computer architecture concepts, CPU components, and memory hierarchy',
    downloads: '1,243',
    views: '3,107',
    rating: '4.8',
    date: '15/5/2024',
    subject: 'Computer Organization and Architecture',
    uploader: 'Nguyen Van A',
  },
  {
    code: 'CSD201',
    type: 'Notes',
    title: 'CSD201 - Summary Notes: Tree Algorithms',
    description: 'Handwritten notes explaining BST, AVL, and Red-Black trees with visual examples',
    downloads: '1,089',
    views: '2,740',
    rating: '4.8',
    date: '18/5/2024',
    subject: 'Data Structures and Algorithms',
    uploader: 'Vu Van F',
  },
  {
    code: 'PRO192',
    type: 'Assignment',
    title: 'PRO192 - Assignment 2: OOP Design Patterns',
    description: 'Assignment covering Singleton, Factory, and Observer patterns with UML diagrams',
    downloads: '945',
    views: '2,300',
    rating: '4.5',
    date: '19/5/2024',
    subject: 'Object-Oriented Programming',
    uploader: 'Hoang Thi E',
  },
  {
    code: 'DBI202',
    type: 'Lab',
    title: 'DBI202 - Lab 3: SQL Queries Practice',
    description: 'Lab exercises for practicing SELECT, JOIN, and subqueries with sample database',
    downloads: '876',
    views: '1,940',
    rating: '4.7',
    date: '12/5/2024',
    subject: 'Database Systems',
    uploader: 'Le Kim C',
  },
]

export const libraryFiles = [
  {
    id: 1,
    name: '漢字--JPD316 Lesson 5-NEW.pptx',
    subject: 'Japanese',
    kind: 'session',
    group: 'Yesterday',
    date: 'May 29, 2026',
    shared: false,
    public: false,
    favorite: true,
  },
  {
    id: 2,
    name: 'CEA201 - Chapter 3 Pipeline.pdf',
    subject: 'Computer Architecture',
    kind: 'session',
    group: 'Yesterday',
    date: 'May 29, 2026',
    shared: false,
    public: false,
    favorite: false,
  },
  {
    id: 3,
    name: 'PRF192 - Arrays and Functions.pptx',
    subject: 'Programming',
    kind: 'session',
    group: 'This Week',
    date: 'May 28, 2026',
    shared: false,
    public: false,
    favorite: true,
  },
  {
    id: 4,
    name: 'SWP391 - Software Project Management.pdf',
    subject: 'Software Engineering',
    kind: 'document',
    group: 'This Week',
    date: 'May 28, 2026',
    shared: false,
    public: false,
    favorite: false,
  },
  {
    id: 5,
    name: 'Advanced Programming Techniques.pdf',
    subject: 'Shared by John Doe',
    category: 'Programming',
    kind: 'document',
    group: 'This Week',
    date: 'May 27, 2026',
    shared: true,
    public: false,
    favorite: false,
  },
  {
    id: 6,
    name: 'Database Design Patterns.pptx',
    subject: 'Shared by Jane Smith',
    kind: 'document',
    group: 'This Week',
    date: 'May 26, 2026',
    shared: true,
    public: false,
    favorite: false,
  },
  {
    id: 7,
    name: 'Calculus I - Lecture Notes.pdf',
    subject: 'Mathematics',
    kind: 'document',
    group: 'This Week',
    date: 'May 27, 2026',
    shared: false,
    public: true,
    favorite: false,
  },
  {
    id: 8,
    name: 'Introduction to Machine Learning.pptx',
    subject: 'AI & Data Science',
    kind: 'document',
    group: 'This Week',
    date: 'May 25, 2026',
    shared: false,
    public: true,
    favorite: true,
  },
  {
    id: 9,
    name: 'OOP Concepts - Java.pdf',
    subject: 'Programming',
    kind: 'document',
    group: 'This Week',
    date: 'May 24, 2026',
    shared: false,
    public: true,
    favorite: false,
  },
]

export const libraryFolders = [
  { id: 1, name: 'CEA201 Materials', count: 5, date: 'Created May 20, 2026' },
  { id: 2, name: 'PRF192 Labs', count: 8, date: 'Created May 18, 2026' },
  { id: 3, name: 'Final Exam Prep', count: 3, date: 'Created May 15, 2026' },
]

export const libraryFolderFileMap = {
  1: [libraryFiles[1], libraryFiles[3], libraryFiles[4], libraryFiles[6], libraryFiles[8]],
  2: [libraryFiles[2], libraryFiles[5], libraryFiles[8], libraryFiles[0], libraryFiles[3], libraryFiles[4], libraryFiles[6], libraryFiles[7]],
  3: [libraryFiles[0], libraryFiles[2], libraryFiles[7]],
}

export const uploadSelectFields = [
  {
    label: 'Ngành học *',
    placeholder: 'Chọn ngành học',
    options: ['Công nghệ thông tin', 'Kỹ thuật phần mềm', 'Trí tuệ nhân tạo', 'An toàn thông tin', 'Thiết kế đồ họa', 'Ngôn ngữ Nhật'],
  },
  {
    label: 'Học kỳ *',
    placeholder: 'Chọn học kỳ',
    options: ['Kỳ 1', 'Kỳ 2', 'Kỳ 3', 'Kỳ 4', 'Kỳ 5', 'Kỳ 6', 'Kỳ 7', 'Kỳ 8', 'Kỳ 9'],
  },
  {
    label: 'Mã môn học *',
    hint: '[1 môn]',
    placeholder: 'Chọn mã môn học',
    options: ['PRF192', 'PRO192', 'CSD201', 'DBI202', 'SWP391', 'CEA201', 'JPD316', 'MAS291'],
  },
  {
    label: 'Loại tài liệu *',
    placeholder: 'Chọn loại tài liệu',
    options: ['Slide', 'Notes', 'Assignment', 'Lab', 'Exam', 'Source Code', 'Project'],
  },
]

export const recentActivities = [
  ['Tải lên tài liệu: CEA201 - Chapter 3: Memory Hierarchy', '2 giờ trước'],
  ['Tải xuống: SWP391 - Project Template', '1 ngày trước'],
  ['Bình luận: PRF192 - Final Exam 2023', '3 ngày trước'],
]

export const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Tài liệu được duyệt',
    text: 'Tài liệu "Giải tích 1 - Đề cương ôn tập" của bạn đã được admin duyệt và đăng lên cộng đồng',
    author: 'Admin FPTU',
    time: '5 phút trước',
    icon: 'check',
  },
  {
    id: 2,
    type: 'info',
    title: 'Bình luận mới',
    text: 'Nguyễn Văn A đã bình luận vào tài liệu "Lập trình hướng đối tượng - Java": Cảm ơn bạn',
    author: 'Nguyễn Văn A',
    time: '30 phút trước',
    icon: 'message',
  },
  {
    id: 3,
    type: 'purple',
    title: 'Trả lời bình luận',
    text: 'Trần Thị B đã trả lời bình luận của bạn: "Mình cũng đồng ý, phần bài tập rất hay!"',
    author: 'Trần Thị B',
    time: '2 giờ trước',
    icon: 'reply',
  },
  {
    id: 4,
    type: 'danger',
    title: 'Tài liệu bị từ chối',
    text: 'Tài liệu "Vật lý đại cương - Chương 3" chưa đạt yêu cầu. Lý do: Nội dung chưa đầy đủ',
    author: 'Admin FPTU',
    time: '5 giờ trước',
    icon: 'x',
  },
]

export const studyTabs = [
  { id: 'original', label: 'Original Content', icon: 'file' },
  { id: 'notes', label: 'AI Notes', icon: 'sparkle' },
  { id: 'summary', label: 'AI Summary', icon: 'book' },
  { id: 'flashcards', label: 'Flashcards', icon: 'card' },
  { id: 'quizzes', label: 'Quizzes', icon: 'help' },
]
