export const libraryTabs = [
  { id: 'sessions', label: 'Study sessions', icon: 'book' },
  { id: 'shared', label: 'Shared and public', icon: 'share', count: 5 },
  { id: 'favorites', label: 'Yêu thích', icon: 'heart', count: 3 },
  { id: 'folders', label: 'Folders', icon: 'folder' },
  { id: 'recent', label: 'Recent', icon: 'calendar' },
]

export const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '0đ',
    subtitle: 'Hoàn hảo để bắt đầu học tập',
    tone: 'muted',
    features: ['Truy cập 100+ tài liệu miễn phí', 'Tải xuống 5 tài liệu/tháng', 'AI Chat cơ bản'],
    disabled: ['Tải lên tài liệu riêng', 'Truy cập tài liệu cao cấp', 'AI Chat không giới hạn'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '19.000đ',
    subtitle: 'Dành cho sinh viên nghiêm túc',
    tone: 'blue',
    popular: true,
    features: [
      'Tất cả tính năng Free',
      'Tải xuống không giới hạn',
      'AI Chat nâng cao',
      'Lưu trữ 5GB',
      'Tải lên 50 tài liệu/tháng',
      'Chia sẻ tài liệu riêng tư',
    ],
    disabled: ['Ưu tiên hỗ trợ'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '59.000đ',
    subtitle: 'Trải nghiệm học tập tối ưu',
    tone: 'purple',
    features: [
      'Tất cả tính năng Pro',
      'Lưu trữ không giới hạn',
      'Tải lên không giới hạn',
      'Truy cập sớm tính năng mới',
      'Ưu tiên hỗ trợ 24/7',
      'Tạo study groups riêng',
      'Tùy chỉnh giao diện',
    ],
    disabled: [],
  },
]

export const adminNavItems = [
  { id: 'admin-overview', label: 'Tổng quan', icon: 'trend' },
  { id: 'admin-users', label: 'Người dùng', icon: 'users' },
  { id: 'admin-documents', label: 'Tài liệu', icon: 'file' },
  { id: 'admin-courses', label: 'Môn học', icon: 'book' },
  { id: 'admin-storage', label: 'Storage', icon: 'archive' },
  { id: 'admin-reports', label: 'Báo cáo', icon: 'flag' },
  { id: 'admin-logs', label: 'Activity Logs', icon: 'trend' },
  { id: 'admin-settings', label: 'Cài đặt', icon: 'sparkle' },
]

export const adminUsers = [
  { initial: 'N', name: 'Nguyễn Văn A', email: 'studenta@fpt.edu.vn', joined: '20/5/2024', docs: 12, status: 'active' },
  { initial: 'T', name: 'Trần Thị B', email: 'studentb@fpt.edu.vn', joined: '19/5/2024', docs: 8, status: 'active' },
  { initial: 'L', name: 'Lê Văn C', email: 'studentc@fpt.edu.vn', joined: '18/5/2024', docs: 15, status: 'blocked' },
  { initial: 'P', name: 'Phạm Văn D', email: 'studentd@fpt.edu.vn', joined: '17/5/2024', docs: 5, status: 'active' },
  { initial: 'H', name: 'Hoàng Thị E', email: 'studente@fpt.edu.vn', joined: '16/5/2024', docs: 20, status: 'active' },
]

export const adminDocuments = [
  ['CEA201 - Chapter 5: Cache Memory', 'Nguyễn Văn A', '20/5/2024', 0, 'pending'],
  ['PRF192 - Assignment Solution', 'Trần Thị B', '19/5/2024', 0, 'pending'],
  ['DBI202 - SQL Practice', 'Lê Văn C', '18/5/2024', 145, 'approved'],
  ['SWP391 - Project Template', 'Phạm Văn D', '17/5/2024', 230, 'approved'],
  ['PRO192 - OOP Design Patterns', 'Hoàng Thị E', '16/5/2024', 0, 'rejected'],
]

export const adminCourses = [
  ['CEA201', 'Computer Architecture', 'Kỳ 3', 'SE', 234],
  ['PRF192', 'Programming Fundamentals', 'Kỳ 1', 'SE', 198],
  ['DBI202', 'Database Management', 'Kỳ 3', 'SE', 156],
  ['SWP391', 'Software Project', 'Kỳ 5', 'SE', 142],
  ['PRO192', 'Object-Oriented Programming', 'Kỳ 2', 'SE', 128],
  ['MAE101', 'Mathematics for Engineering', 'Kỳ 1', 'SE', 89],
]
