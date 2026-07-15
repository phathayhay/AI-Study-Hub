import { useEffect, useRef, useState } from 'react'
import FeaturedDocuments from '../../components/home/FeaturedDocuments'
import FeaturedFolders from '../../components/home/FeaturedFolders'
import HeroSearch from '../../components/home/HeroSearch'
import StatsSummary from '../../components/home/StatsSummary'
import StudyHubIcon, { getFileIconName, getFileIconColor } from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { appUser, featuredDocuments, featuredFolders, recentActivities, majors, popularCourses } from '../../data/studyHubData'
import { pricingPlans } from './config'
import { getActivePlans, getUpgradePaymentInfo } from '../../services/subscriptionService'
import { DocumentCardMini, ExploreFolderCard, InfoLine, PageTitle, SectionTitle } from './shared'
import {
  searchDocuments as getDocuments,
  getDocument,
  downloadDocumentFile,
  uploadDocument
} from '../../features/documents/documentService'
import {
  addFavorite as favoriteDocument,
  removeFavorite as unfavoriteDocument,
  rateDocument,
  getUserFavorites as getFavoriteDocuments
} from '../../services/communityService'
import {
  getComments as getDocumentComments,
  addComment as addDocumentComment,
  updateComment as updateDocumentComment,
  deleteComment as deleteDocumentComment
} from '../../services/commentService'
import {
  getFolder,
  getPublicFolder,
  getPublicFolders,
  updateFolderVisibility
} from '../../features/folders/folderService'
import { getMajors, getCourses, getCategories } from '../../services/courseService'
import { getToken } from '../../services/api'

const uploadSelectFields = [
  {
    label: 'Major *',
    placeholder: 'Select major',
    options: ['Information Technology', 'Software Engineering', 'Artificial Intelligence', 'Information Security', 'Graphic Design', 'Japanese Language'],
  },
  {
    label: 'Semester *',
    placeholder: 'Select semester',
    options: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'],
  },
  {
    label: 'Course Code *',
    hint: '[1 course]',
    placeholder: 'Select course code',
    options: ['PRF192', 'PRO192', 'CSD201', 'DBI202', 'SWP391', 'CEA201', 'JPD316', 'MAS291'],
  },
  {
    label: 'Document Type *',
    placeholder: 'Select document type',
    options: ['Slide', 'Notes', 'Assignment', 'Lab', 'Exam', 'Source Code', 'Project'],
  },
]

export function HomeScreen({ guest = false, onNavigate }) {
  const handleSearch = (keyword) => {
    onNavigate('explore', { keyword })
  }
  const handleSelectMajor = (majorCode) => {
    onNavigate('explore', { majorCode })
  }
  const handleSelectCourse = (courseCode) => {
    onNavigate('explore', { courseCode })
  }

  return (
    <main className="home-main dark:bg-[#0f172a] dark:bg-none">
      <div className="home-container">
        <HeroSearch 
          title={guest ? 'Study Materials for FPTU Students' : 'FPTU Study Materials'} 
          onSearch={handleSearch}
          onSelectMajor={handleSelectMajor}
          onSelectCourse={handleSelectCourse}
        />
        <StatsSummary />
        <div onClick={() => onNavigate('folder-detail')} role="presentation">
          <FeaturedFolders />
        </div>
        <div onClick={() => onNavigate('doc-detail')} role="presentation">
          <FeaturedDocuments />
        </div>
      </div>
    </main>
  )
}

const MAJOR_MAP = {
  'SE': 1,
  'AI': 2,
  'GD': 3,
  'IA': 4,
  'SS': 5
}

const COURSE_MAP = {
  'CEA201': 1,
  'PRF192': 2,
  'DBI202': 3,
  'SWP391': 4,
  'PRO192': 5
}

const SHARED_FOUNDATION_PREFIXES = ['PRF', 'PRO', 'CSD', 'DBI', 'MAD', 'MAE', 'OSG', 'JPD', 'WED', 'SWT', 'SSI', 'PFP', 'SSL']

function resolveMajorCode(majorValue, majorsList = []) {
  if (!majorValue) return ''

  const rawValue = String(majorValue).trim()
  const normalizedValue = rawValue.toUpperCase()
  const matchedMajor = majorsList.find(
    (major) => major.majorCode?.toUpperCase() === normalizedValue || major.majorName?.toUpperCase() === normalizedValue
  )

  if (matchedMajor?.majorCode) {
    return String(matchedMajor.majorCode).toUpperCase()
  }

  const fallbackMap = {
    'SOFTWARE ENGINEERING': 'SE',
    'ARTIFICIAL INTELLIGENCE': 'AI',
    'INFORMATION ASSURANCE': 'IA',
    'INFORMATION SECURITY': 'SS',
    'GRAPHIC DESIGN': 'GD',
    'JAPANESE LANGUAGE': 'JL',
  }

  return fallbackMap[normalizedValue] || normalizedValue
}

function isSharedFoundationCourse(courseCode = '') {
  const normalizedCourseCode = String(courseCode).trim().toUpperCase()
  return SHARED_FOUNDATION_PREFIXES.some((prefix) => normalizedCourseCode.startsWith(prefix))
}

function getCourseMajorCodes(course, majorsList = []) {
  const codesFromMajors = Array.isArray(course?.majors)
    ? course.majors
        .map((major) => resolveMajorCode(major?.majorCode || major?.majorName, majorsList))
        .filter(Boolean)
    : []

  if (codesFromMajors.length > 0) {
    return [...new Set(codesFromMajors)]
  }

  const fallbackCode = resolveMajorCode(course?.major?.majorCode || course?.major?.majorName, majorsList)
  return fallbackCode ? [fallbackCode] : []
}

function isCourseEligibleForMajor(course, selectedMajor, majorsList = []) {
  const selectedMajorCode = resolveMajorCode(selectedMajor, majorsList)
  if (!selectedMajorCode || selectedMajorCode === 'ALL') return true

  if (isSharedFoundationCourse(course?.courseCode)) return true

  return getCourseMajorCodes(course, majorsList).includes(selectedMajorCode)
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between h-[210px] shadow-sm animate-pulse">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 rounded-md w-16" />
          <div className="h-5 bg-slate-200 rounded-full w-10" />
        </div>
        <div className="h-5 bg-slate-200 rounded w-5/6" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
      </div>
      <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
        <div className="h-4 bg-slate-100 rounded w-24" />
        <div className="h-4 bg-slate-100 rounded w-12" />
      </div>
    </div>
  )
}

function ExploreSkeleton() {
  return (
    <div className="w-full flex flex-col gap-8">
      {/* Grid Sections Skeletons */}
      <div className="space-y-6">
        <div className="h-7 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ExploreSearchFilter({
  searchQuery,
  setSearchQuery,
  selectedMajor,
  setSelectedMajor,
  selectedCourse,
  setSelectedCourse,
  popularCourses,
  majors,
  guest
}) {
  return (
    <section className="hero-section flex flex-col items-center text-center py-10 px-6 w-full bg-transparent dark:bg-transparent border border-transparent dark:border-transparent rounded-3xl transition-all duration-300" aria-labelledby="home-title">
      <h1 id="home-title" className="text-3xl md:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-none mb-3">
        {guest ? 'Study Materials for FPTU Students' : 'FPTU Study Materials'}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 text-sm md:text-base leading-relaxed">Search, share, and manage academic documents powered by Gemini AI</p>

      {/* Search Input Box */}
      <div
        className="hero-search flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-2xl px-5 py-3.5 transition-all duration-300 hover:border-indigo-300 hover:shadow-sm focus-within:border-indigo-500 focus-within:shadow-md focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-slate-700"
        role="search"
      >
        <StudyHubIcon name="search" size={20} className="text-slate-400 dark:text-slate-500" />
        <input
          className="w-full text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border-0 outline-none text-base bg-transparent font-medium"
          placeholder="Search by course code, document title, or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-lg px-2 bg-transparent border-0 outline-none cursor-pointer font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter Row Section */}
      <div className="hero-filters w-full max-w-2xl mt-8 flex flex-col gap-4">
        {/* Major Filter */}
        <div className="filter-row flex flex-wrap gap-2 items-center justify-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-600 dark:text-slate-300 mr-1 flex items-center gap-1"><StudyHubIcon name="globe" size={14} /> Major:</span>
          {['ALL', ...majors].map((major) => {
            const isSelected = selectedMajor === major;
            return (
              <button
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-200 ${isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                key={major}
                type="button"
                onClick={() => {
                  setSelectedMajor(major)
                  setSelectedCourse(null) // clear selected course when changing major
                }}
              >
                {major === 'ALL' ? 'All Majors' : major}
              </button>
            );
          })}
        </div>

        {/* Course Filter */}
        <div className="filter-row flex flex-wrap gap-2 items-center justify-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-600 dark:text-slate-300 mr-1 flex items-center gap-1"><StudyHubIcon name="book" size={14} /> Course:</span>
          {popularCourses.map((course) => {
            const isSelected = selectedCourse === course;
            return (
              <button
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-200 ${isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                key={course}
                type="button"
                onClick={() => setSelectedCourse(isSelected ? null : course)}
              >
                {course}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  )
}

function DocumentCard({ doc, onOpen, guest }) {
  const [favorite, setFavorite] = useState(Boolean(doc.favorite))

  useEffect(() => {
    setFavorite(Boolean(doc.favorite))
  }, [doc.favorite])

  const handleToggleFavorite = (event) => {
    event.stopPropagation()
    if (guest) {
      window.showToast?.('Please login to add to favorites', 'info')
      return
    }

    const docId = doc.id
    if (!docId) return

    const apiCall = favorite ? unfavoriteDocument(docId) : favoriteDocument(docId)
    apiCall
      .then(() => {
        setFavorite(!favorite)
        window.showToast?.(favorite ? 'Removed from favorites' : 'Added to favorites', 'success')
      })
      .catch(err => {
        window.showToast?.(err.message || 'Error updating favorites', 'error')
      })
  }

  // Define file type badge coloring
  const typeUpper = (doc.type || 'PDF').toUpperCase()
  let typeBadgeBg = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
  if (typeUpper === 'PDF') {
    typeBadgeBg = 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50'
  } else if (typeUpper === 'DOCX' || typeUpper === 'DOC') {
    typeBadgeBg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50'
  } else if (typeUpper === 'PPTX' || typeUpper === 'PPT') {
    typeBadgeBg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
  }

  // Format date
  const formatDocDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const dateObj = new Date(dateStr)
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <article
      onClick={onOpen}
      className="group flex flex-col justify-between bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-[210px] relative hover:-translate-y-0.5"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${typeBadgeBg}`}>
              <StudyHubIcon name={getFileIconName(typeUpper)} size={12} className="flex-shrink-0" />
              {typeUpper}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              {doc.code}
            </span>
          </div>
          <button
            onClick={handleToggleFavorite}
            type="button"
            className={`p-1.5 rounded-full border border-slate-100 dark:border-slate-700 hover:border-red-100 hover:bg-red-50/50 transition-colors bg-transparent ${favorite ? 'text-red-500 border-red-50' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <StudyHubIcon name="heart" size={15} className={favorite ? 'fill-current' : ''} />
          </button>
        </div>

        <h3 className="text-[14.5px] font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-1">
          {doc.title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">
          {doc.description || 'No detailed description available.'}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11.5px] text-slate-400 dark:text-slate-500 font-medium">
        <span className="flex items-center gap-1"><StudyHubIcon name="download" size={13} /> {doc.downloads} downloads</span>
        <span>{formatDocDate(doc.createdAt)}</span>
      </div>
    </article>
  )
}

export const getDocCourseCode = (doc) => {
  if (!doc) return 'FPTU'
  const title = doc.title || doc.fileName || ''
  const match = title.match(/([a-z]{3}\d{3})|(PRF|PRO|CSD|DBI|SWP|CEA|MAS|JPD)/i)
  return match ? match[0].toUpperCase() : (doc.fileType || doc.type || 'DOC')
}

function matchesDocumentMajor(doc, selectedMajor, coursesList = [], majorsList = []) {
  const selectedMajorCode = resolveMajorCode(selectedMajor, majorsList)
  if (!selectedMajorCode || selectedMajorCode === 'ALL') return true

  const documentCourseCode = getDocCourseCode(doc)
  const matchedCourse =
    coursesList.find((course) => Number(course?.id) === Number(doc?.courseId)) ||
    coursesList.find((course) => String(course?.courseCode || '').toUpperCase() === documentCourseCode)

  if (matchedCourse) {
    return isCourseEligibleForMajor(matchedCourse, selectedMajorCode, majorsList)
  }

  if (doc?.major && resolveMajorCode(doc.major, majorsList) === selectedMajorCode) {
    return true
  }

  return isSharedFoundationCourse(documentCourseCode)
}

function getFolderCode(folderName = '') {
  const codeMatch = folderName.match(/^([A-Z]{3}\d{3})/i)
  return codeMatch ? codeMatch[1].toUpperCase() : 'FPTU'
}

function formatFolderMetric(value, singularLabel) {
  return value === 1 ? `1 ${singularLabel}` : `${value} ${singularLabel}s`
}

function mapFolderToCard(folder) {
  const fileCount = Number(folder?.publicDocumentCount ?? folder?.documents?.length ?? 0)
  const downloadCount = Number(folder?.totalDownloads ?? 0)
  const ownerName = folder?.ownerName || 'FPTU community'

  return {
    id: folder?.id,
    code: getFolderCode(folder?.folderName || ''),
    title: folder?.folderName || 'Untitled Folder',
    description: `Public study collection by ${ownerName}`,
    files: formatFolderMetric(fileCount, 'file'),
    downloads: formatFolderMetric(downloadCount, 'download'),
    favorite: false
  }
}

export function ExplorePage({ 
  onNavigate, 
  onOpenDocument, 
  onOpenFolder, 
  guest = false,
  user = null,
  initialKeyword = '',
  initialMajor = 'ALL',
  initialCourse = null
}) {
  const [selectedMajor, setSelectedMajor] = useState(initialMajor)
  const [selectedCourse, setSelectedCourse] = useState(initialCourse)
  const [searchQuery, setSearchQuery] = useState(initialKeyword)

  useEffect(() => {
    setSearchQuery(initialKeyword)
    setSelectedMajor(initialMajor)
    setSelectedCourse(initialCourse)
  }, [initialKeyword, initialMajor, initialCourse])

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [realFolders, setRealFolders] = useState([])
  const [foldersLoading, setFoldersLoading] = useState(false)

  const [majorsList, setMajorsList] = useState([])
  const [coursesList, setCoursesList] = useState([])
  const [categoriesList, setCategoriesList] = useState([])

  useEffect(() => {
    getMajors()
      .then(res => {
        if (res?.success && Array.isArray(res?.data)) {
          setMajorsList(res.data.filter(m => m.majorCode !== 'ALL'))
        }
      })
      .catch(err => console.error('Failed to load majors:', err))

    getCourses()
      .then(res => {
        if (res?.success && Array.isArray(res?.data)) {
          setCoursesList(res.data)
        }
      })
      .catch(err => console.error('Failed to load courses:', err))

    getCategories()
      .then(res => {
        if (res?.success && Array.isArray(res?.data)) {
          setCategoriesList(res.data)
        }
      })
      .catch(err => console.error('Failed to load categories:', err))
  }, [])

  useEffect(() => {
    if (guest || !user?.id) {
      setFavoriteIds(new Set())
      return
    }

    getFavoriteDocuments()
      .then((res) => {
        const list = res?.content || res?.data?.content || res?.data || res || []
        setFavoriteIds(new Set(list.map(item => item.id)))
      })
      .catch((err) => console.error('Failed to load favorites', err))
  }, [guest, user?.id])

  useEffect(() => {
    let active = true
    setFoldersLoading(true)

    const fetchPublicFolders = async () => {
      try {
        const response = await getPublicFolders()
        const folderList = Array.isArray(response)
          ? response
          : (response?.data || response?.content || [])

        if (active) {
          setRealFolders(folderList.map(mapFolderToCard))
        }
      } catch (err) {
        console.error('Failed to load public folders:', err)
        if (active) {
          setRealFolders([])
        }
      } finally {
        if (active) setFoldersLoading(false)
      }
    }

    fetchPublicFolders()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    const majorId = null

    const courseObj = coursesList.find(c => c.courseCode === selectedCourse)
    const courseId = courseObj ? courseObj.id : null

    getDocuments({ keyword: searchQuery || null, majorId, courseId, page: 0, size: 100 })
      .then((res) => {
        if (!active) return
        const docs = res?.content || res?.data?.content || res || []
        setDocuments(docs.filter((doc) => matchesDocumentMajor(doc, selectedMajor, coursesList, majorsList)))
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Could not load documents from backend.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [searchQuery, selectedMajor, selectedCourse, majorsList, coursesList])

  const filteredFolders = realFolders.filter(f =>
    (selectedMajor === 'ALL' || (f.code && f.code.startsWith(selectedMajor))) &&
    (!searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )




  const trendingDocs = [...documents]
    .sort((a, b) => (b.totalDownloads || b.downloads || 0) - (a.totalDownloads || a.downloads || 0))
    .slice(0, 3)

  const recentlyAddedDocs = [...documents]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 3)

  const recommendedDocs = [...documents]
    .filter(doc => {
      if (selectedMajor !== 'ALL') {
        return matchesDocumentMajor(doc, selectedMajor, coursesList, majorsList)
      }
      return (doc.averageRating || doc.rating || 0) >= 4.0 || (doc.totalDownloads || doc.downloads || 0) > 10
    })
    .slice(0, 3)

  const isFiltered = searchQuery || selectedCourse || selectedMajor !== 'ALL'

  return (
    <main className="home-main dark:bg-[#0f172a] dark:bg-none" style={{ overflowY: 'auto', flex: 1, padding: '0 24px' }}>
      <div className="home-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px 0 40px' }}>

        {/* Search & Filter Component */}
        <ExploreSearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedMajor={selectedMajor}
          setSelectedMajor={setSelectedMajor}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          popularCourses={
            selectedMajor === 'ALL'
              ? coursesList.slice(0, 10).map(c => c.courseCode)
              : coursesList.filter(c => isCourseEligibleForMajor(c, selectedMajor, majorsList)).slice(0, 10).map(c => c.courseCode)
          }
          majors={majorsList.map(m => m.majorCode)}
          guest={guest}
        />

        {/* Stats Section or Loading Skeleton */}
        {loading ? (
          <ExploreSkeleton />
        ) : (
          <>
            {error ? (
              <div className="p-10 border border-red-100 rounded-2xl text-center text-red-500 bg-red-50/30">{error}</div>
            ) : documents.length === 0 ? (
              <div className="p-10 border border-slate-100 rounded-2xl text-center text-slate-500 bg-slate-50/20">No documents found. Try adjusting your search or filters.</div>
            ) : isFiltered ? (
              <div className="flex flex-col gap-10">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span>🔍</span> Found Documents
                    </h2>
                    <span className="text-xs text-slate-400 font-semibold">{documents.length} items</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={{
                          id: doc.id,
                          code: getDocCourseCode(doc),
                          type: doc.fileType || 'PDF',
                          title: doc.title,
                          description: doc.description,
                          downloads: doc.totalDownloads || doc.downloads || 0,
                          rating: doc.averageRating || doc.rating || 0,
                          createdAt: doc.createdAt,
                          favorite: favoriteIds.has(doc.id)
                        }}
                        onOpen={() => onOpenDocument?.(doc.id)}
                        guest={guest}
                      />
                    ))}
                  </div>
                </section>

                {/* Featured Folders Section */}
                <section className="border-t border-slate-100 pt-8 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span>📁</span> Featured Study Folders
                    </h2>
                  </div>
                  <FeaturedFolders folders={filteredFolders} onOpenFolder={onOpenFolder} hideHeader={true} />
                </section>
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {/* Trending Section */}
                {trendingDocs.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>🔥</span> Trending This Week
                      </h2>
                      <span className="text-xs text-slate-400 font-semibold">Most downloaded</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {trendingDocs.map((doc) => (
                        <DocumentCard
                          key={`trending-${doc.id}`}
                          doc={{
                            id: doc.id,
                            code: getDocCourseCode(doc),
                            type: doc.fileType || 'PDF',
                            title: doc.title,
                            description: doc.description,
                            downloads: doc.totalDownloads || doc.downloads || 0,
                            rating: doc.averageRating || doc.rating || 0,
                            createdAt: doc.createdAt,
                            favorite: favoriteIds.has(doc.id)
                          }}
                          onOpen={() => onOpenDocument?.(doc.id)}
                          guest={guest}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Recommended Section */}
                {recommendedDocs.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>✨</span> Recommended for You
                      </h2>
                      <span className="text-xs text-slate-400 font-semibold">Based on your activity</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendedDocs.map((doc) => (
                        <DocumentCard
                          key={`rec-${doc.id}`}
                          doc={{
                            id: doc.id,
                            code: getDocCourseCode(doc),
                            type: doc.fileType || 'PDF',
                            title: doc.title,
                            description: doc.description,
                            downloads: doc.totalDownloads || doc.downloads || 0,
                            rating: doc.averageRating || doc.rating || 0,
                            createdAt: doc.createdAt,
                            favorite: favoriteIds.has(doc.id)
                          }}
                          onOpen={() => onOpenDocument?.(doc.id)}
                          guest={guest}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Recently Added Section */}
                {recentlyAddedDocs.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>🕒</span> Recently Added
                      </h2>
                      <span className="text-xs text-slate-400 font-semibold">Latest updates</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recentlyAddedDocs.map((doc) => (
                        <DocumentCard
                          key={`recent-${doc.id}`}
                          doc={{
                            id: doc.id,
                            code: getDocCourseCode(doc),
                            type: doc.fileType || 'PDF',
                            title: doc.title,
                            description: doc.description,
                            downloads: doc.totalDownloads || doc.downloads || 0,
                            rating: doc.averageRating || doc.rating || 0,
                            createdAt: doc.createdAt,
                            favorite: favoriteIds.has(doc.id)
                          }}
                          onOpen={() => onOpenDocument?.(doc.id)}
                          guest={guest}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Featured Folders Section */}
                <section className="border-t border-slate-100 pt-8 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span>📁</span> Featured Study Folders
                    </h2>
                  </div>
                  <FeaturedFolders folders={filteredFolders} onOpenFolder={onOpenFolder} hideHeader={true} />
                </section>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  )
}
const UPLOAD_COURSE_MAP = {
  'CEA201': 1,
  'PRF192': 2,
  'DBI202': 3,
  'SWP391': 4,
  'PRO192': 5,
  'CSD201': 6,
  'JPD316': 7,
  'MAS291': 15
}

const UPLOAD_CATEGORY_MAP = {
  'Slide': 1,
  'Notes': 6,
  'Assignment': 2,
  'Lab': 3,
  'Exam': 4,
  'Source Code': 5,
  'Project': 5
}

export function UploadPage({ mode = 'document', onStudyFileUploaded, onDocumentUploaded, onNavigate, defaultFolderId = null, user = null }) {
  const [selectedUploadFile, setSelectedUploadFile] = useState(null)
  const [uploadedText, setUploadedText] = useState('')
  const [readStatus, setReadStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedMajor, setSelectedMajor] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [majorsList, setMajorsList] = useState([])
  const [coursesList, setCoursesList] = useState([])
  const [categoriesList, setCategoriesList] = useState([])

  useEffect(() => {
    getMajors().then(res => {
      if (res?.success && Array.isArray(res?.data)) setMajorsList(res.data.filter(m => m.majorCode !== 'ALL'))
    }).catch(err => console.error(err))

    getCourses().then(res => {
      if (res?.success && Array.isArray(res?.data)) setCoursesList(res.data)
    }).catch(err => console.error(err))

    getCategories().then(res => {
      if (res?.success && Array.isArray(res?.data)) setCategoriesList(res.data)
    }).catch(err => console.error(err))
  }, [])
  const fileInputRef = useRef(null)
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const visibilityRef = useRef(null)
  const tagsRef = useRef(null)
  const isStudyUpload = mode === 'study'
  const storageLimitMb = Number(user?.planStorageLimitMb || 0)
  const storageUsedBytes = Number(user?.planStorageUsedBytes || 0)
  const storageUsedMb = Number.isFinite(user?.planStorageUsedMb) ? Number(user.planStorageUsedMb) : storageUsedBytes / (1024 * 1024)
  const remainingStorageBytes = Math.max((storageLimitMb * 1024 * 1024) - storageUsedBytes, 0)
  const selectedFileSize = Number(selectedUploadFile?.size || 0)
  const isOverQuota = Boolean(user?.overQuota)
  const wouldExceedQuota = !isOverQuota && selectedFileSize > 0 && selectedFileSize > remainingStorageBytes
  const uploadBlocked = isOverQuota || wouldExceedQuota
  const quotaWarningMessage = isOverQuota
    ? (user?.storageMessage || 'Your current storage usage exceeds the FREE plan limit. You can still view, download, and delete your existing documents, but uploading new documents is temporarily disabled.')
    : wouldExceedQuota
      ? 'This file would push your storage beyond the current plan limit. Delete some files or upgrade your plan before uploading.'
      : ''

  const handleFileSelect = async (files) => {
    const [file] = Array.from(files ?? [])
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the limit of 10MB. Please select a smaller file.')
      window.showToast?.('File size exceeds 10MB limit', 'error')
      setSelectedUploadFile(null)
      return
    }

    setSelectedUploadFile(file)
    setUploadedText('')
    setReadStatus('')
    setUploadError('')
    setUploadSuccess(false)

    if (canReadAsText(file)) {
      try {
        const text = await file.text()
        setUploadedText(text.trim())
        setReadStatus(text.trim() ? 'File content read successfully.' : 'No text content found in the file to display.')
      } catch {
        setReadStatus('Unable to read file content.')
      }
    }
  }

  const clearSelectedFile = () => {
    setSelectedUploadFile(null)
    setUploadedText('')
    setReadStatus('')
    setUploadError('')
    setUploadSuccess(false)
    setSelectedMajor('')
    setSelectedSemester('')
    setSelectedCourse('')
    setSelectedCategory('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startStudySession = () => {
    handleUpload()
  }

  const handleUpload = async () => {
    if (!selectedUploadFile) return
    if (uploadBlocked) {
      const message = quotaWarningMessage || 'Storage limit exceeded. Delete existing files or upgrade your plan.'
      setUploadError(message)
      window.showToast?.(message, 'error')
      return
    }
    if (selectedUploadFile.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the limit of 10MB. Please select a smaller file.')
      window.showToast?.('File size exceeds 10MB limit', 'error')
      return
    }
    const title = titleRef.current?.value?.trim() || ''
    const description = descRef.current?.value?.trim() || ''
    const visibility = visibilityRef.current?.value || 'PRIVATE'
    const tagsRaw = tagsRef.current?.value?.trim() || ''
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []

    const requiredFields = [
      { value: title, label: 'Document Title' },
      { value: selectedMajor, label: 'Major' },
      { value: selectedSemester, label: 'Semester' },
      { value: selectedCourse, label: 'Course Code' },
      { value: selectedCategory, label: 'Document Type' },
    ]

    const missingField = requiredFields.find((field) => !field.value)
    if (missingField) {
      const message = `${missingField.label} is required before uploading.`
      setUploadError(message)
      window.showToast?.(message, 'error')
      return
    }

    const courseObj = coursesList.find(c => c.courseCode === selectedCourse)
    const courseId = courseObj ? courseObj.id : null

    const categoryObj = categoriesList.find(c => c.categoryName === selectedCategory)
    const categoryId = categoryObj ? categoryObj.id : null

    setUploading(true)
    setUploadError('')
    setUploadSuccess(false)
    try {
      const res = await uploadDocument(selectedUploadFile, {
        title,
        description,
        visibility,
        tags,
        courseId,
        categoryId,
        folderId: defaultFolderId || undefined
      })
      const doc = res?.data || res
      setUploadSuccess(true)
      window.showToast?.('Document uploaded successfully', 'success')
      setTimeout(() => {
        onDocumentUploaded?.(doc)
        clearSelectedFile()
        if (isStudyUpload && onStudyFileUploaded) {
          onStudyFileUploaded({
            id: doc?.id || doc?.documentId,
            documentId: doc?.id || doc?.documentId,
            name: title,
            attachmentName: selectedUploadFile.name,
            content: '',
            fileUrl: doc?.fileUrl || '',
            visibility: doc?.visibility || visibility || 'PRIVATE',
            folderId: doc?.folderId ?? defaultFolderId ?? null,
          })
        }
        if (!isStudyUpload && onNavigate) {
          onNavigate('doc-detail', { documentId: doc?.id || doc?.documentId })
        }
      }, 1000)
    } catch (err) {
      const errMsg = err?.message || 'Upload failed'
      setUploadError(errMsg)
      window.showToast?.(errMsg, 'error')
    } finally { setUploading(false) }
  }

  return (
    <main className="page-surface upload-page">
      <PageTitle
        title={isStudyUpload ? 'Create New Study Session' : 'Upload Document'}
        subtitle={isStudyUpload ? 'Upload a file to let AI create a study workspace from your content' : 'Share study documents with the FPTU community or store them privately'}
      />
      <section className="upload-card">
        {(isOverQuota || wouldExceedQuota) && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left text-sm text-amber-900">
            <strong className="block text-sm font-semibold">Storage attention needed</strong>
            <p className="mt-2 mb-0 leading-6">
              {quotaWarningMessage}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span><strong>Current plan:</strong> {user?.planName || 'FREE'}</span>
              <span><strong>Used:</strong> {formatFileSize(storageUsedBytes)}</span>
              <span><strong>Limit:</strong> {formatFileSize(storageLimitMb * 1024 * 1024)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="file-picker-button" onClick={() => onNavigate?.('library')} type="button">
                Manage Documents
              </button>
              <button className="cancel-button" onClick={() => onNavigate?.('pricing')} type="button">
                Upgrade Plan
              </button>
            </div>
          </div>
        )}
        {!selectedUploadFile ? (
          <>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp"
              onChange={(event) => handleFileSelect(event.target.files)}
            />
            <div
              className="drop-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                handleFileSelect(event.dataTransfer.files)
              }}
            >
              <StudyHubIcon name="upload" size={46} />
              <h3>Drag and drop files or folders here</h3>
              <p>or</p>
              <button className="file-picker-button" disabled={isOverQuota} onClick={() => fileInputRef.current?.click()} type="button">
                <StudyHubIcon name="file" size={18} /> Select File
              </button>
              <small>Supported formats: PDF, Word, PowerPoint, ZIP (max 10MB)</small>
            </div>
            <button className="upload-submit" disabled={isOverQuota} onClick={() => fileInputRef.current?.click()} type="button">Upload</button>
          </>
        ) : (
          <div className="upload-form">
            <h3>Selected File (1)</h3>
            <div className="selected-file">
              <StudyHubIcon name="file" size={18} />
              <span><strong>{selectedUploadFile.name}</strong><small>{formatFileSize(selectedUploadFile.size)}</small></span>
              <button onClick={clearSelectedFile} type="button">×</button>
            </div>
            {readStatus && <p className="upload-read-status">{readStatus}</p>}
            {uploadError && <p className="auth-error">{uploadError}</p>}
            {uploadSuccess && <p className="upload-success">Uploaded successfully!</p>}
            <label>Document Title *<input ref={titleRef} defaultValue={selectedUploadFile.name} placeholder="Enter document title" /></label>
            <label>Description<textarea ref={descRef} placeholder="Brief description of the document..." /></label>
            <div className="upload-form__grid">
              {(() => {
                const dynamicSelectFields = [
                  {
                    label: 'Major *',
                    placeholder: 'Select major',
                    options: majorsList.map(m => m.majorName),
                    value: selectedMajor,
                    onChange: (e) => {
                      setSelectedMajor(e.target.value)
                      setSelectedCourse('') // reset course
                    }
                  },
                  {
                    label: 'Semester *',
                    placeholder: 'Select semester',
                    options: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'],
                    value: selectedSemester,
                    onChange: (e) => setSelectedSemester(e.target.value)
                  },
                  {
                    label: 'Course Code *',
                    hint: '[1 course]',
                    placeholder: 'Select course code',
                    options: coursesList
                      .filter(c => !selectedMajor || isCourseEligibleForMajor(c, selectedMajor, majorsList))
                      .map(c => c.courseCode),
                    value: selectedCourse,
                    onChange: (e) => setSelectedCourse(e.target.value)
                  },
                  {
                    label: 'Document Type *',
                    placeholder: 'Select document type',
                    options: categoriesList.map(c => c.categoryName),
                    value: selectedCategory,
                    onChange: (e) => setSelectedCategory(e.target.value)
                  }
                ]

                return dynamicSelectFields.map((field) => (
                  <label key={field.label}>
                    {field.label} {field.hint && <small>{field.hint}</small>}
                    <select value={field.value} onChange={field.onChange}>
                      <option disabled value="">{field.placeholder}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ))
              })()}
              <label>Visibility<select ref={visibilityRef} defaultValue="PRIVATE">
                <option value="PUBLIC">Public</option><option value="PRIVATE">Private</option>
              </select></label>
              <label>Tags (separated by commas)<input ref={tagsRef} placeholder="SWP, Study, ..." /></label>
            </div>
            <div className="upload-form__actions">
              <button className="upload-submit" onClick={isStudyUpload ? startStudySession : handleUpload} type="button" disabled={uploading || uploadBlocked}>
                {uploading
                  ? 'Uploading...'
                  : uploadBlocked
                    ? (isOverQuota ? 'Upload disabled' : 'Over plan limit')
                    : (isStudyUpload ? 'Start Studying with AI' : 'Upload')}
              </button>
              <button className="cancel-button" onClick={clearSelectedFile} type="button">Cancel</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export function ProfilePage({ user: propUser }) {
  const [localUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const user = propUser || localUser

  return (
    <main className="page-surface profile-page">
      <section className="profile-card">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="profile-avatar" style={{ objectFit: 'cover' }} />
        ) : (
          <div className="profile-avatar">{user?.fullName?.[0] || 'SV'}</div>
        )}
        <div>
          <h1>{user?.fullName || appUser.name} <button type="button"><StudyHubIcon name="edit" size={16} /> Edit</button></h1>
          <p><StudyHubIcon name="mail" size={16} /> {user?.email || appUser.email}</p>
          <p><StudyHubIcon name="globe" size={16} /> {appUser.city}</p>
          <p><StudyHubIcon name="calendar" size={16} /> {appUser.joined}</p>
        </div>
      </section>
      <div className="profile-stats">
        {[
          ['upload', '12', 'Uploaded Documents'],
          ['download', '1,234', 'Downloads'],
          ['star', '4.8', 'Average Rating'],
        ].map(([icon, value, label]) => (
          <article key={label}>
            <span><StudyHubIcon name={icon} size={24} /></span>
            <strong>{value}</strong>
            <small>{label}</small>
          </article>
        ))}
      </div>
      <section className="activity-card">
        <h2>Recent Activities</h2>
        {recentActivities.map(([text, time]) => (
          <div className="activity-row" key={text}>
            <span><StudyHubIcon name="user" size={18} /></span>
            <p>{text}<small>{time}</small></p>
          </div>
        ))}
      </section>
    </main>
  )
}

function canReadAsText(file) {
  const readableExtensions = ['.txt', '.md', '.csv', '.json', '.html', '.css', '.js', '.jsx', '.ts', '.tsx']
  const lowerName = file.name.toLowerCase()
  return file.type.startsWith('text/') || readableExtensions.some((extension) => lowerName.endsWith(extension))
}

export function FolderDetailPage({ id, onNavigate, onLoad, onOpenDocument, guest = false, user = null }) {
  const [folder, setFolder] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    const hasToken = !!getToken()
    if (!hasToken || guest || !user?.id) {
      setFavoriteIds(new Set())
      return
    }

    getFavoriteDocuments()
      .then((res) => {
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : res?.data?.content || res?.content || [])
        setFavoriteIds(new Set(list.map(item => item.id)))
      })
      .catch((err) => console.error('Failed to load favorites', err))
  }, [guest, user?.id])

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setError('')

    const loadFolder = async () => {
      const hasToken = !!getToken()

      try {
        const publicRes = await getPublicFolder(id)
        const data = publicRes?.data || publicRes
        if (!active) return
        setFolder(data)
        onLoad?.(data)
        return
      } catch (publicErr) {
        if (!hasToken) {
          if (active) {
            setError(publicErr?.message || 'This public folder is not available.')
          }
          return
        }
      }

      try {
        const privateRes = await getFolder(id)
        const data = privateRes?.data || privateRes
        if (!active) return
        setFolder(data)
        onLoad?.(data)
      } catch (privateErr) {
        if (!active) return
        setError(privateErr?.message || 'Could not load folder details.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadFolder().finally(() => {
      if (active) {
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [id])

  const f = folder || {
    folderName: 'PRF192 - Programming Fundamentals Full Pack',
    name: 'PRF192 - Programming Fundamentals Full Pack',
    description: 'Complete PRF192 study materials: Lectures, sample source code, past exams + answers',
    documents: []
  }

  const folderName = f.folderName || f.name || 'Untitled Folder'
  const docCount = f.documents?.length || f.publicDocumentCount || 0
  const totalDownloads = Number(f.totalDownloads || 0)
  const isOwner = Number(user?.id) === Number(f.userId)
  const isPublic = f.visibility === 'PUBLIC'

  const handleToggleVisibility = async () => {
    if (!isOwner || !f.id) return

    setPublishing(true)
    try {
      const nextVisibility = isPublic ? 'PRIVATE' : 'PUBLIC'
      const response = await updateFolderVisibility(f.id, nextVisibility)
      const data = response?.data || response
      setFolder(data)
      onLoad?.(data)
      window.showToast?.(
        nextVisibility === 'PUBLIC'
          ? 'Folder published to Explore successfully.'
          : 'Folder removed from Explore successfully.',
        'success'
      )
    } catch (err) {
      window.showToast?.(err?.message || 'Could not update folder visibility.', 'error')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <main className="page-surface bg-slate-50 dark:bg-[#0f172a] min-h-screen py-6 !px-4 md:!px-6 lg:!px-8 xl:!px-10 transition-colors duration-300 ease-in-out">
        <div className="max-w-[1536px] w-full mx-auto">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-pulse h-40" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-surface bg-slate-50 dark:bg-[#0f172a] min-h-screen py-6 !px-4 md:!px-6 lg:!px-8 xl:!px-10 transition-colors duration-300 ease-in-out">
        <div className="max-w-[1536px] w-full mx-auto">
          <div className="bg-white dark:bg-[#1e293b] border border-red-100 dark:border-red-900/40 rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">Folder not available</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 mb-0">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-surface bg-slate-50 dark:bg-[#0f172a] min-h-screen py-6 !px-4 md:!px-6 lg:!px-8 xl:!px-10 transition-colors duration-300 ease-in-out" style={{ overflowY: 'auto', flex: 1 }}>
      <div className="max-w-[1536px] w-full mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight m-0">{folderName}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 m-0 leading-relaxed whitespace-pre-line">{f.description || 'Study Document Folder'}</p>
        </div>

        <section className="folder-hero-card flex flex-wrap items-center gap-4 bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300 ease-in-out">
          <span className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <StudyHubIcon name="folder" size={24} />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge tone="blue">{getFolderCode(folderName)}</Badge>
              <Badge tone={isPublic ? 'green' : 'orange'}>{isPublic ? 'Public Collection' : 'Private Folder'}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><StudyHubIcon name="file" size={14} /> {docCount} document{docCount !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><StudyHubIcon name="download" size={14} /> {totalDownloads} download{totalDownloads !== 1 ? 's' : ''}</span>
              {f.ownerName && <span className="flex items-center gap-1"><StudyHubIcon name="user" size={14} /> {f.ownerName}</span>}
            </div>
            {isOwner && !f.publishReady && f.publishBlockedReason && (
              <p className="text-xs text-amber-600 dark:text-amber-400 m-0 mt-1 max-w-2xl">{f.publishBlockedReason}</p>
            )}
          </div>
          {isOwner && (
            <button
              className={`ml-auto py-2.5 px-5 rounded-xl text-xs font-bold transition-colors cursor-pointer border-0 shadow-sm flex items-center gap-1.5 ${
                isPublic
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              type="button"
              onClick={handleToggleVisibility}
              disabled={publishing}
            >
              <StudyHubIcon name={isPublic ? 'lock' : 'globe'} size={14} />
              {publishing ? 'Saving...' : isPublic ? 'Make Private' : 'Publish to Explore'}
            </button>
          )}
        </section>

        <SectionTitle icon="file" title="Documents in Folder" count={docCount} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {docCount > 0 ? (
            f.documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={{
                  id: doc.id,
                  code: getDocCourseCode(doc),
                  type: doc.fileType || 'PDF',
                  title: doc.title,
                  description: doc.description,
                  downloads: doc.totalDownloads || doc.downloads || 0,
                  rating: doc.averageRating || doc.rating || 0,
                  createdAt: doc.createdAt,
                  favorite: favoriteIds.has(doc.id)
                }}
                onOpen={() => onOpenDocument?.(doc.id)}
                guest={guest}
              />
            ))
          ) : (
            <p className="text-slate-400 text-sm py-8 text-center m-0" style={{ gridColumn: '1 / -1' }}>No documents in this folder yet</p>
          )}
        </div>
      </div>
    </main>
  )
}

function DocumentDetailSkeleton() {
  return (
    <div className="w-full max-w-[1536px] mx-auto py-6 px-4 md:px-6 lg:px-8 xl:px-10 flex flex-col lg:flex-row gap-8 animate-pulse bg-slate-50">
      {/* Left Column */}
      <div className="flex-1 space-y-6">
        <div className="h-6 bg-slate-200 rounded w-20" />
        <div className="space-y-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
        </div>
        <div className="h-[650px] md:h-[750px] lg:h-[800px] bg-slate-200 rounded-2xl" />
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="h-6 bg-slate-200 rounded w-32" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
        </div>
      </div>
      {/* Right Column */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-6">
        <div className="h-[420px] bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-2">
                <div className="w-5 h-5 bg-slate-200 rounded" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-slate-200 rounded-xl w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentViewer({ doc, onBack }) {
  const fileUrl = doc.fileUrl;
  const isPdf = fileUrl && (fileUrl.toLowerCase().endsWith('.pdf') || (doc.fileType || doc.type || '').toUpperCase() === 'PDF');
  const isLocal = fileUrl && (fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1'));
  const downloadCount = doc.downloads || doc.totalDownloads || 0;
  const viewCount = doc.views || doc.totalViews || 0;

  return (
    <section className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5 transition-colors duration-300 ease-in-out">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {doc.code ? <Badge tone="blue">{doc.code}</Badge> : null}
          <Badge>{doc.fileType || doc.type}</Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mt-1">
          {doc.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">{doc.description}</p>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
          <span className="flex items-center gap-1"><StudyHubIcon name="download" size={14} /> {downloadCount} download{downloadCount !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1"><StudyHubIcon name="eye" size={14} /> {viewCount} view{viewCount !== 1 ? 's' : ''}</span>
          <span className="rating flex items-center gap-1 text-amber-500">★ {doc.rating || doc.averageRating || 0} </span>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800 my-1" />

      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Document Preview</h2>
        {fileUrl ? (
          isPdf ? (
            <div className="document-preview-container w-full h-[650px] md:h-[750px] lg:h-[800px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <iframe
                src={fileUrl}
                width="100%"
                height="100%"
                title="Document Preview"
                style={{ backgroundColor: '#f8fafc', border: 'none' }}
              />
            </div>
          ) : isLocal ? (
            <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50 dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 flex flex-col items-center gap-4 transition-colors duration-300">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center">
                <StudyHubIcon name="file" size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-300">Unable to preview file on localhost</h4>
                <p className="text-sm text-slate-500 dark:text-slate-450 max-w-md leading-relaxed mx-auto transition-colors duration-300">
                  Google Docs Viewer cannot load files from localhost. Please download the file to view it.
                </p>
              </div>
              <a
                href={fileUrl}
                download={doc.title || 'document'}
                className="inline-flex items-center gap-2 py-2 px-5 bg-blue-600 text-white rounded-xl text-sm font-bold no-underline transition-colors hover:bg-blue-700"
              >
                <StudyHubIcon name="download" size={14} /> Download Document
              </a>
            </div>
          ) : (
            <div className="document-preview-container w-full h-[650px] md:h-[750px] lg:h-[800px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                width="100%"
                height="100%"
                title="Document Preview"
                style={{ backgroundColor: '#f8fafc', border: 'none' }}
              />
            </div>
          )
        ) : (
          <div className="p-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-[#1e293b] transition-colors duration-300">
            <StudyHubIcon name="file" size={48} className="text-slate-400" />
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 m-0 mb-1">No file available to preview</p>
              <small className="text-xs text-slate-400 dark:text-slate-500">This document does not have any attached content</small>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function CommentSection({
  comments,
  commentContent,
  setCommentContent,
  commentsLoading,
  onAddComment,
  onReplyComment,
  onEditComment,
  onDeleteComment,
  currentUserId,
  documentOwnerId,
  guest
}) {
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingContent, setEditingContent] = useState('')

  const getCommentCount = (items) => items.reduce(
    (total, item) => total + 1 + getCommentCount(item.replies || []),
    0
  )

  const renderCommentItem = (comment, depth = 0) => {
    const userName = comment.fullName || comment.user?.fullName || comment.userName || 'Student'
    const avatarUrl = comment.avatarUrl || comment.user?.avatarUrl || ''
    const initial = userName[0]?.toUpperCase() || 'S'
    const dateStr = comment.createdAt
      ? new Date(comment.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Just now'
    const isReplying = replyingToId === comment.id
    const isEditing = editingCommentId === comment.id
    const canEdit = Number(currentUserId) === Number(comment.userId)
    const canDelete = canEdit || Number(documentOwnerId) === Number(currentUserId)

    return (
      <div className="flex flex-col gap-3" key={comment.id} style={{ marginLeft: depth > 0 ? `${Math.min(depth, 3) * 24}px` : 0 }}>
        <div className="comment-row flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initial}
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1 gap-3">
              <strong className="text-sm font-bold text-slate-900">{userName}</strong>
              <small className="text-xs text-slate-400 font-medium whitespace-nowrap">{dateStr}</small>
            </div>
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full min-h-[84px] p-3 text-sm text-slate-800 border border-slate-200 rounded-xl outline-none resize-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="py-1.5 px-3 bg-transparent text-slate-500 hover:text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer"
                    onClick={() => {
                      setEditingCommentId(null)
                      setEditingContent('')
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold border-0 cursor-pointer"
                    disabled={commentsLoading || !editingContent.trim()}
                    onClick={() => {
                      onEditComment?.(comment.id, editingContent.trim())
                      setEditingCommentId(null)
                      setEditingContent('')
                    }}
                    type="button"
                  >
                    {commentsLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed m-0 whitespace-pre-line">{comment.content}</p>
            )}
            {!guest && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {!isEditing && (
                  <button
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-transparent border-0 cursor-pointer p-0"
                    onClick={() => {
                      setReplyingToId(isReplying ? null : comment.id)
                      setReplyContent('')
                    }}
                    type="button"
                  >
                    {isReplying ? 'Cancel reply' : 'Reply'}
                  </button>
                )}
                {canEdit && !isEditing && (
                  <button
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-transparent border-0 cursor-pointer p-0"
                    onClick={() => {
                      setEditingCommentId(comment.id)
                      setEditingContent(comment.content || '')
                      setReplyingToId(null)
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                )}
                {canDelete && !isEditing && (
                  <button
                    className="text-xs font-semibold text-red-500 hover:text-red-600 bg-transparent border-0 cursor-pointer p-0"
                    onClick={() => onDeleteComment?.(comment.id)}
                    type="button"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {isReplying && (
          <div className="ml-12 flex flex-col gap-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full min-h-[84px] p-3 text-sm text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl outline-none resize-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex justify-end">
              <button
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white disabled:text-slate-500 rounded-xl text-xs font-bold transition-colors cursor-pointer border-0"
                disabled={commentsLoading || !replyContent.trim()}
                onClick={() => {
                  onReplyComment?.(comment.id, replyContent.trim())
                  setReplyingToId(null)
                  setReplyContent('')
                }}
                type="button"
              >
                {commentsLoading ? 'Sending...' : 'Send reply'}
              </button>
            </div>
          </div>
        )}

        {(comment.replies || []).length > 0 && (
          <div className="flex flex-col gap-3">
            {comment.replies.map((reply) => renderCommentItem(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <section id="comments-section" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-6 mt-6">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 m-0">
        <StudyHubIcon name="message" size={20} className="text-slate-600" />
        Comments ({getCommentCount(comments)})
      </h2>

      {/* Comments List */}
      <div className="comments-list flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
        {comments.length > 0 ? (
          comments.map((comment) => renderCommentItem(comment))
        ) : (
          <p className="text-slate-400 text-sm text-center py-8 m-0">No comments yet. Be the first to comment!</p>
        )}
      </div>

      {/* Input Section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
          <textarea
            placeholder={guest ? "Log in to write a comment..." : "Write a comment..."}
            disabled={guest}
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="w-full min-h-[90px] p-4 text-sm text-slate-800 placeholder-slate-400 border-0 outline-none resize-none bg-transparent"
          />
          <div className="flex justify-end p-2 bg-slate-50 border-t border-slate-100">
            <button
              className="py-2 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white disabled:text-slate-500 rounded-xl text-xs font-bold transition-colors cursor-pointer border-0"
              type="button"
              disabled={guest || commentsLoading || !commentContent.trim()}
              onClick={onAddComment}
            >
              {commentsLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function DocumentSidebar({
  doc,
  guest,
  isFavorite,
  userRating,
  hoverRating,
  setHoverRating,
  onRate,
  onToggleFavorite,
  onStudyWithAI,
  onDownload,
  onReport,
  onNavigate
}) {
  const uploader = doc.uploader || doc.user?.fullName || 'Anonymous User';
  const uploadDate = doc.createdAt
    ? new Date(doc.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : (doc.date || 'N/A');

  return (
    <aside className="doc-info-card bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 sticky top-6 transition-colors duration-305 ease-in-out">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 m-0">Document Info</h2>
        <div className="flex flex-col gap-3">
          <InfoLine icon="user" label="Uploaded by" value={uploader} />
          <InfoLine icon="calendar" label="Upload Date" value={uploadDate} />
          <InfoLine icon="file" label="Subject" value={doc.subject || doc.fileType || 'N/A'} />
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800 my-0" />

      {/* Synchronized Buttons Column */}
      <div className="flex flex-col gap-3">
        {doc.fileUrl && (
          <button
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer"
            type="button"
            onClick={() => {
              if (guest) {
                onNavigate?.('login')
              } else {
                onDownload?.()
              }
            }}
          >
            <StudyHubIcon name="download" size={16} /> Download Document
          </button>
        )}

        <button
          className="w-full py-2.5 px-4 bg-purple-50 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-slate-600 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-slate-600 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0"
          type="button"
          onClick={onStudyWithAI}
        >
          <StudyHubIcon name="message" size={16} /> Chat with AI
        </button>

        <button
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${isFavorite
            ? 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 border-0'
            : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 border-0'
            }`}
          type="button"
          onClick={onToggleFavorite}
        >
          <StudyHubIcon name="heart" size={16} />
          {isFavorite ? 'Favorited' : 'Favorite'}
        </button>

        <button
          className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0"
          type="button"
          onClick={() => guest ? onNavigate?.('login') : window.showToast?.('Share link copied', 'success')}
        >
          <StudyHubIcon name="share" size={16} /> Share
        </button>

        <button
          className="w-full py-2.5 px-4 bg-white dark:bg-[#1e293b] hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          onClick={() => guest ? onNavigate?.('login') : onReport?.()}
          type="button"
        >
          <StudyHubIcon name="flag" size={16} /> Report
        </button>
      </div>

      <hr className="border-slate-100 dark:border-slate-800 my-0" />

      {/* Document Rating */}
      <div className="document-rating-panel flex flex-col items-center gap-2">
        <span className="document-rating-label text-xs font-semibold text-slate-500 dark:text-slate-400">Your rating</span>
        <div className="rating-row flex gap-1.5 cursor-pointer text-2xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => onRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className={`rating-star transition-transform duration-100 hover:scale-110 ${
                star <= (hoverRating || userRating || Math.round(doc.rating || doc.averageRating || 0)) ? 'is-active' : ''
              }`}
            >
              {star <= (hoverRating || userRating || Math.round(doc.rating || doc.averageRating || 0)) ? '★' : '☆'}
            </span>
          ))}
        </div>
        <span className="document-rating-hint text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          Tap a star to rate this document
        </span>
      </div>
    </aside>
  )
}

export function DocumentDetailPage({ id, onBack, onReport, guest = false, onNavigate, onOpenStudyFile, onLoad, user = null }) {
  const [doc, setDoc] = useState(null)
  const [comments, setComments] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [commentContent, setCommentContent] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')

    getDocument(id)
      .then((res) => {
        const data = res?.data || res
        setDoc(data)
        onLoad?.(data)
      })
      .catch((err) => {
        setError(err.message || 'Could not load document from backend.')
      })
      .finally(() => {
        setLoading(false)
      })

    // Load comments
    getDocumentComments(id)
      .then((res) => {
        const list = res?.data || res || []
        setComments(list)
      })
      .catch((err) => console.error('Failed to load comments', err))

    // Check if favorited
    if (!guest && user?.id) {
      getFavoriteDocuments()
        .then((res) => {
          const list = res?.content || res?.data?.content || res?.data || res || []
          const isFav = list.some(fav => fav.id === Number(id))
          setIsFavorite(isFav)
        })
        .catch((err) => console.error('Failed to check favorites', err))
    } else {
      setIsFavorite(false)
    }
  }, [id, guest, user?.id])

  useEffect(() => {
    if (loading || window.location.hash !== '#comments') return
    const timer = window.setTimeout(() => {
      window.document.getElementById('comments-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [loading, comments.length, id])

  const d = doc || featuredDocuments[1]

  const reloadComments = () =>
    getDocumentComments(d.id)
      .then((res) => {
        setComments(res?.data || res || [])
      })

  const handleStudyWithAI = () => {
    if (guest) {
      onNavigate?.('login')
    } else if (onOpenStudyFile) {
      onOpenStudyFile({
        id: d.id,
        name: d.title || 'Untitled Document',
        subject: d.subject || d.type || 'Document',
        fileUrl: d.fileUrl || '',
        visibility: d.visibility || 'PUBLIC',
      })
    }
  }

  const handleDownload = async () => {
    if (guest) {
      onNavigate?.('login')
      return
    }

    try {
      const response = await downloadDocumentFile(d.id)
      const filename = d.fileName || d.title || 'document'
      const objectUrl = window.URL.createObjectURL(response.blob)
      const link = window.document.createElement('a')
      link.href = objectUrl
      link.download = filename
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)

      setDoc((current) => current
        ? {
            ...current,
            totalDownloads: (current.totalDownloads || current.downloads || 0) + 1,
            downloads: (current.downloads || current.totalDownloads || 0) + 1
          }
        : current)
    } catch (err) {
      if (err?.status === 401) {
        onNavigate?.('login')
        return
      }
      window.showToast?.('Download failed. Please try again.', 'error')
    }
  }

  const handleToggleFavorite = () => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    const apiCall = isFavorite ? unfavoriteDocument(d.id) : favoriteDocument(d.id)
    apiCall
      .then(() => {
        setIsFavorite(!isFavorite)
        window.showToast?.(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success')
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Error updating favorites', 'error')
      })
  }

  const handleRate = (value) => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    rateDocument(d.id, { rating: value })
      .then(() => {
        setUserRating(value)
        window.showToast?.('Rated successfully', 'success')
        // Refresh document details to update average rating
        getDocument(id).then(res => {
          const data = res?.data || res
          setDoc(data)
        })
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Failed to submit rating', 'error')
      })
  }

  const handleAddComment = () => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    if (!commentContent.trim()) return
    setCommentsLoading(true)
    addDocumentComment(d.id, { content: commentContent.trim() })
      .then(() => {
        setCommentContent('')
        window.showToast?.('Comment added successfully', 'success')
        return reloadComments()
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Failed to add comment', 'error')
      })
      .finally(() => setCommentsLoading(false))
  }

  const handleReplyComment = (parentCommentId, content) => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    if (!content.trim()) return
    setCommentsLoading(true)
    addDocumentComment(d.id, {
      content: content.trim(),
      parentCommentId
    })
      .then(() => {
        window.showToast?.('Reply added successfully', 'success')
        return reloadComments()
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Failed to add reply', 'error')
      })
      .finally(() => setCommentsLoading(false))
  }

  const handleEditComment = (commentId, content) => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    if (!content.trim()) return
    setCommentsLoading(true)
    updateDocumentComment(commentId, { content: content.trim() })
      .then(() => {
        window.showToast?.('Comment updated successfully', 'success')
        return reloadComments()
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Failed to update comment', 'error')
      })
      .finally(() => setCommentsLoading(false))
  }

  const handleDeleteComment = (commentId) => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    setCommentsLoading(true)
    deleteDocumentComment(commentId)
      .then(() => {
        window.showToast?.('Comment deleted successfully', 'success')
        return reloadComments()
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Failed to delete comment', 'error')
      })
      .finally(() => setCommentsLoading(false))
  }

  if (loading) {
    return <DocumentDetailSkeleton />;
  }

  if (error) {
    return (
      <main className="page-surface py-12 text-center flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#0f172a] min-h-screen transition-colors duration-300 ease-in-out">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-3xl mx-auto">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Document Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{error}</p>
        <button
          onClick={onBack}
          className="mt-2 py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold border-0 cursor-pointer"
        >
          Go Back
        </button>
      </main>
    );
  }

  return (
    <main className="page-surface bg-slate-50 dark:bg-[#0f172a] min-h-screen py-6 !px-4 md:!px-6 lg:!px-8 xl:!px-10 transition-colors duration-300 ease-in-out" style={{ overflowY: 'auto', flex: 1 }}>
      <div className="max-w-[1536px] w-full mx-auto flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column (Main Content) */}
        <div className="flex-1 w-full min-w-0">
          <DocumentViewer doc={d} onBack={onBack} />

          <CommentSection
            comments={comments}
            commentContent={commentContent}
            setCommentContent={setCommentContent}
            commentsLoading={commentsLoading}
            onAddComment={handleAddComment}
            onReplyComment={handleReplyComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            currentUserId={user?.id}
            documentOwnerId={d.userId}
            guest={guest}
          />
        </div>

        {/* Right Column (Sticky Sidebar) */}
        <div className="w-full lg:w-[320px] shrink-0">
          <DocumentSidebar
            doc={d}
            guest={guest}
            isFavorite={isFavorite}
            userRating={userRating}
            hoverRating={hoverRating}
            setHoverRating={setHoverRating}
            onRate={handleRate}
            onToggleFavorite={handleToggleFavorite}
            onStudyWithAI={handleStudyWithAI}
            onDownload={handleDownload}
            onReport={onReport}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </main>
  )
}

export function PricingPage({ onNavigate, user, onSelectUpgrade }) {
  const [plans, setPlans] = useState([])
  const [loadingPlanId, setLoadingPlanId] = useState(null)

  useEffect(() => {
    getActivePlans()
      .then(res => {
        if (res?.success && Array.isArray(res?.data)) {
          setPlans(res.data)
        }
      })
      .catch(err => {
        console.error('Failed to fetch active plans:', err)
      })
  }, [])

  const currentPlan = user?.planName?.toUpperCase() || 'FREE'

  const handleUpgrade = async (plan, backendId) => {
    if (!user) {
      window.showToast?.('Vui lòng đăng nhập để nâng cấp gói tài khoản!', 'info')
      onNavigate('login')
      return
    }

    if (!backendId) {
      window.showToast?.('Không tìm thấy thông tin gói này trên hệ thống!', 'error')
      return
    }

    setLoadingPlanId(backendId)
    try {
      const res = await getUpgradePaymentInfo({ planId: backendId })
      if (res?.success && res?.data) {
        onSelectUpgrade?.(plan, res.data)
      } else {
        window.showToast?.('Không thể lấy thông tin thanh toán!', 'error')
      }
    } catch (err) {
      window.showToast?.(err.message || 'Lỗi kết nối khi lấy thông tin thanh toán!', 'error')
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <main className="page-surface pricing-page">
      <button aria-label="Back" className="back-pill" onClick={() => onNavigate('library')} type="button">
        <StudyHubIcon name="arrow-left" size={18} />
      </button>
      <PageTitle title="Choose the Plan That's Right for You" subtitle="Upgrade to experience all AI learning features" centered />
      <button className="billing-pill" type="button">Monthly</button>
      <div className="pricing-grid">
        {pricingPlans.map((plan) => {
          const backendPlan = plans.find(p => p.planName?.toUpperCase() === plan.id.toUpperCase())
          const backendId = backendPlan?.id
          
          // Display backend price if available, otherwise static
          const priceDisplay = backendPlan 
            ? (backendPlan.price === 0 ? '0đ' : `${Number(backendPlan.price).toLocaleString('vi-VN')}đ`)
            : plan.price

          // Button states
          let buttonText = ''
          let isBtnDisabled = false

          if (plan.id === 'free') {
            if (currentPlan === 'FREE') {
              buttonText = 'Current Plan'
              isBtnDisabled = true
            } else {
              buttonText = 'Get Started for Free'
              isBtnDisabled = true
            }
          } else {
            const planUpper = plan.id.toUpperCase()
            if (currentPlan === planUpper) {
              buttonText = 'Current Plan'
              isBtnDisabled = true
            } else if (currentPlan === 'PREMIUM' && planUpper === 'PRO') {
              buttonText = 'Pro Plan (Downgrade not supported)'
              isBtnDisabled = true
            } else {
              buttonText = loadingPlanId === backendId ? 'Processing...' : `Upgrade to ${plan.name} →`
              isBtnDisabled = loadingPlanId !== null
            }
          }

          return (
            <article className={`pricing-card pricing-card--${plan.tone}`} key={plan.id}>
              {plan.popular && <span className="popular-ribbon">Most Popular</span>}
              <span className="plan-icon"><StudyHubIcon name={plan.id === 'free' ? 'star' : 'book'} size={30} /></span>
              <h2>{plan.name}</h2>
              <p>{backendPlan?.description || plan.subtitle}</p>
              <strong>{priceDisplay}<small>/month</small></strong>
              <ul>
                {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
                {plan.disabled.map((feature) => <li className="disabled" key={feature}>× {feature}</li>)}
              </ul>
              <button 
                className={plan.id === 'premium' ? 'purple-button' : 'primary-action'} 
                disabled={isBtnDisabled} 
                onClick={() => handleUpgrade(plan, backendId)}
                type="button"
              >
                {buttonText}
              </button>
            </article>
          )
        })}
      </div>
      <section className="faq-card">
        <h2>Frequently Asked Questions</h2>
        {[
          'Can I cancel at any time?',
          'What payment methods are accepted?',
          'Can I get a refund?',
          'Can I upgrade or downgrade my plan?',
        ].map((question) => (
          <div key={question}>
            <h3>{question}</h3>
            <p>Yes, you can change or cancel at any time. Fees are calculated based on usage duration.</p>
          </div>
        ))}
      </section>
    </main>
  )
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** unitIndex
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}
