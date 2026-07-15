export const libraryTabs = [
  { id: 'sessions', label: 'Study sessions', icon: 'book' },
  { id: 'shared', label: 'Shared and public', icon: 'share', count: 5 },
  { id: 'favorites', label: 'Favorites', icon: 'heart', count: 3 },
  { id: 'folders', label: 'Folders', icon: 'folder' },
  { id: 'recent', label: 'Recent', icon: 'calendar' },
]

export const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '0 VND',
    subtitle: 'Starter access for new students',
    tone: 'muted',
    features: ['50 MB storage', '10 AI requests per day', 'AI Summary', 'AI Flashcards', 'AI Quizzes'],
    disabled: ['Public document publishing', 'Public folder publishing'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29,000 VND',
    subtitle: 'Balanced storage and study tools',
    tone: 'blue',
    popular: true,
    features: ['500 MB storage', '100 AI requests per day', 'AI Summary', 'AI Flashcards', 'AI Quizzes', 'Public document publishing', 'Public folder publishing'],
    disabled: [],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '69,000 VND',
    subtitle: 'Highest capacity for heavy workflows',
    tone: 'purple',
    features: ['2,048 MB storage', '1,000 AI requests per day', 'AI Summary', 'AI Flashcards', 'AI Quizzes', 'Public document publishing', 'Public folder publishing'],
    disabled: [],
  },
]

export const adminUsers = [
  { initial: 'N', name: 'Nguyen Van A', email: 'studenta@fpt.edu.vn', joined: '20/5/2024', docs: 12, status: 'active' },
  { initial: 'T', name: 'Tran Thi B', email: 'studentb@fpt.edu.vn', joined: '19/5/2024', docs: 8, status: 'active' },
  { initial: 'L', name: 'Le Van C', email: 'studentc@fpt.edu.vn', joined: '18/5/2024', docs: 15, status: 'blocked' },
  { initial: 'P', name: 'Pham Van D', email: 'studentd@fpt.edu.vn', joined: '17/5/2024', docs: 5, status: 'active' },
  { initial: 'H', name: 'Hoang Thi E', email: 'studente@fpt.edu.vn', joined: '16/5/2024', docs: 20, status: 'active' },
]

export const adminDocuments = [
  ['CEA201 - Chapter 5: Cache Memory', 'Nguyen Van A', '20/5/2024', 0, 'pending'],
  ['PRF192 - Assignment Solution', 'Tran Thi B', '19/5/2024', 0, 'pending'],
  ['DBI202 - SQL Practice', 'Le Van C', '18/5/2024', 145, 'approved'],
  ['SWP391 - Project Template', 'Pham Van D', '17/5/2024', 230, 'approved'],
  ['PRO192 - OOP Design Patterns', 'Hoang Thi E', '16/5/2024', 0, 'rejected'],
]

export const adminCourses = [
  ['CEA201', 'Computer Architecture', 'Semester 3', 'SE', 234],
  ['PRF192', 'Programming Fundamentals', 'Semester 1', 'SE', 198],
  ['DBI202', 'Database Management', 'Semester 3', 'SE', 156],
  ['SWP391', 'Software Project', 'Semester 5', 'SE', 142],
  ['PRO192', 'Object-Oriented Programming', 'Semester 2', 'SE', 128],
  ['MAE101', 'Mathematics for Engineering', 'Semester 1', 'SE', 89],
]
