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

export const adminCourses = [
  ['CEA201', 'Computer Architecture', 'Semester 3', 'SE', 234],
  ['PRF192', 'Programming Fundamentals', 'Semester 1', 'SE', 198],
  ['DBI202', 'Database Management', 'Semester 3', 'SE', 156],
  ['SWP391', 'Software Project', 'Semester 5', 'SE', 142],
  ['PRO192', 'Object-Oriented Programming', 'Semester 2', 'SE', 128],
  ['MAE101', 'Mathematics for Engineering', 'Semester 1', 'SE', 89],
]
