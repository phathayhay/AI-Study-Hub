import { useEffect, useState } from 'react'
import FeaturedFolders from '../../components/home/FeaturedFolders'
import StudyHubIcon, { getFileIconName } from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import {
  searchDocuments as getDocuments
} from '../../features/documents/documentService'
import {
  addFavorite as favoriteDocument,
  removeFavorite as unfavoriteDocument,
  getUserFavorites as getFavoriteDocuments
} from '../../services/communityService'
import {
  getPublicFolders
} from '../../features/folders/folderService'
import { getMajors, getCourses, getCategories } from '../../services/courseService'
import { getToken } from '../../services/api'

const SHARED_FOUNDATION_PREFIXES = ['PRF', 'PRO', 'CSD', 'DBI', 'MAD', 'MAE', 'OSG', 'JPD', 'WED', 'SWT', 'SSI', 'PFP', 'SSL']
const EMPTY_FAVORITE_IDS = new Set()

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
  selectedSemester,
  setSelectedSemester,
  selectedCategory,
  setSelectedCategory,
  popularCourses,
  majors,
  categories,
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
                  setSelectedCourse(null)
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

        <div className="filter-row flex flex-wrap gap-3 items-center justify-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
          <label className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            Semester
            <select
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              onChange={(event) => setSelectedSemester(event.target.value)}
              value={selectedSemester}
            >
              <option value="">All semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => {
                const semester = `Semester ${number}`
                return (
                  <option key={semester} value={semester}>{semester}</option>
                )
              })}
            </select>
          </label>
          <label className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            Type
            <select
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              onChange={(event) => setSelectedCategory(event.target.value)}
              value={selectedCategory}
            >
              <option value="">All document types</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>{category.categoryName}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}

export function DocumentCard({ doc, onOpen, guest, onFavoriteChange }) {
  const [updatingFavorite, setUpdatingFavorite] = useState(false)
  const favorite = Boolean(doc.favorite)

  const handleToggleFavorite = (event) => {
    event.stopPropagation()
    if (guest) {
      window.showToast?.('Please login to add to favorites', 'info')
      return
    }

    const docId = doc.id
    if (!docId) return

    if (updatingFavorite) return

    const nextFavorite = !favorite
    setUpdatingFavorite(true)
    const apiCall = favorite ? unfavoriteDocument(docId) : favoriteDocument(docId)
    apiCall
      .then(() => {
        onFavoriteChange?.(docId, nextFavorite)
        window.showToast?.(favorite ? 'Removed from favorites' : 'Added to favorites', 'success')
      })
      .catch(err => {
        window.showToast?.(err.message || 'Error updating favorites', 'error')
      })
      .finally(() => setUpdatingFavorite(false))
  }

  const typeUpper = (doc.type || 'PDF').toUpperCase()
  let typeBadgeBg = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
  if (typeUpper === 'PDF') {
    typeBadgeBg = 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50'
  } else if (typeUpper === 'DOCX' || typeUpper === 'DOC') {
    typeBadgeBg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50'
  } else if (typeUpper === 'PPTX' || typeUpper === 'PPT') {
    typeBadgeBg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
  }

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
            disabled={updatingFavorite}
            aria-pressed={favorite}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
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
  const codeMatch = folderName.trim().match(/^([A-Z]{2,4}\d{0,3})\b/i)
  return codeMatch ? codeMatch[1].toUpperCase() : 'FPTU'
}

function formatFolderMetric(value, singularLabel) {
  return value === 1 ? `1 ${singularLabel}` : `${value} ${singularLabel}s`
}

function mapFolderToCard(folder) {
  const folderCode = getFolderCode(folder?.folderName || '')
  const documentCourseCodes = Array.isArray(folder?.documents)
    ? folder.documents.map(getDocCourseCode).filter((code) => code && code !== 'DOC')
    : []
  const courseCodes = [...new Set([
    ...(folderCode !== 'FPTU' ? [folderCode] : []),
    ...documentCourseCodes
  ])]
  const fileCount = Number(folder?.publicDocumentCount ?? folder?.documents?.length ?? 0)
  const downloadCount = Number(folder?.totalDownloads ?? 0)
  const ownerName = folder?.ownerName || 'FPTU community'

  return {
    id: folder?.id,
    code: folderCode,
    courseCodes,
    courseIds: (folder?.courseIds || []).map(Number),
    categoryIds: (folder?.categoryIds || []).map(Number),
    semesters: folder?.semesters || [],
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
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState(initialKeyword)

  useEffect(() => {
    setSearchQuery(initialKeyword)
    setSelectedMajor(initialMajor)
    setSelectedCourse(initialCourse)
  }, [initialKeyword, initialMajor, initialCourse])

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [favoriteState, setFavoriteState] = useState({ userId: null, ids: EMPTY_FAVORITE_IDS })
  const favoriteIds = !guest && String(favoriteState.userId) === String(user?.id)
    ? favoriteState.ids
    : EMPTY_FAVORITE_IDS
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
    let active = true

    if (guest || !user?.id) {
      return () => {
        active = false
      }
    }

    getFavoriteDocuments()
      .then((res) => {
        if (!active) return
        const list = res?.content || res?.data?.content || res?.data || res || []
        setFavoriteState({
          userId: String(user.id),
          ids: new Set(list.map(item => String(item.id)))
        })
      })
      .catch((err) => {
        if (active) console.error('Failed to load favorites', err)
      })

    return () => {
      active = false
    }
  }, [guest, user?.id])

  const handleFavoriteChange = (documentId, isFavorite) => {
    const normalizedId = String(documentId)
    const currentUserId = String(user?.id)
    setFavoriteState((current) => {
      const next = String(current.userId) === currentUserId
        ? new Set(current.ids)
        : new Set()
      if (isFavorite) next.add(normalizedId)
      else next.delete(normalizedId)
      return { userId: currentUserId, ids: next }
    })
  }

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

    getDocuments({
      keyword: searchQuery || null,
      majorId,
      courseId,
      categoryId: selectedCategory || null,
      semester: selectedSemester || null,
      page: 0,
      size: 100
    })
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
  }, [searchQuery, selectedMajor, selectedCourse, selectedSemester, selectedCategory, majorsList, coursesList])

  const filteredFolders = realFolders.filter((folder) => {
    const folderCourseCodes = folder.courseCodes || []
    const normalizedCourse = String(selectedCourse || '').toUpperCase()
    const matchesCourse = !normalizedCourse || folderCourseCodes.some((code) =>
      code === normalizedCourse || code.startsWith(normalizedCourse) || normalizedCourse.startsWith(code)
    )
    const matchesSemester = !selectedSemester || folder.semesters.includes(selectedSemester)
    const matchesCategory = !selectedCategory || folder.categoryIds.includes(Number(selectedCategory))

    const candidateCourses = coursesList.filter((course) => {
      const courseCode = String(course?.courseCode || '').toUpperCase()
      return folderCourseCodes.some((code) =>
        code === courseCode || code.startsWith(courseCode) || courseCode.startsWith(code)
      )
    })
    const matchesMajor = selectedMajor === 'ALL' || candidateCourses.some((course) =>
      isCourseEligibleForMajor(course, selectedMajor, majorsList)
    )

    const normalizedQuery = searchQuery.trim().toLowerCase()
    const matchesKeyword = !normalizedQuery || [folder.title, folder.description, folder.code]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))

    return matchesCourse && matchesSemester && matchesCategory && matchesMajor && matchesKeyword
  })

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

  const isFiltered = searchQuery || selectedCourse || selectedSemester || selectedCategory || selectedMajor !== 'ALL'

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
          selectedSemester={selectedSemester}
          setSelectedSemester={setSelectedSemester}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          popularCourses={
            selectedMajor === 'ALL'
              ? coursesList.slice(0, 10).map(c => c.courseCode)
              : coursesList.filter(c => isCourseEligibleForMajor(c, selectedMajor, majorsList)).slice(0, 10).map(c => c.courseCode)
          }
          majors={majorsList.map(m => m.majorCode)}
          categories={categoriesList}
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
                          favorite: favoriteIds.has(String(doc.id))
                        }}
                        onOpen={() => onOpenDocument?.(doc.id)}
                        guest={guest}
                        onFavoriteChange={handleFavoriteChange}
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
                            favorite: favoriteIds.has(String(doc.id))
                          }}
                          onOpen={() => onOpenDocument?.(doc.id)}
                          guest={guest}
                          onFavoriteChange={handleFavoriteChange}
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
                            favorite: favoriteIds.has(String(doc.id))
                          }}
                          onOpen={() => onOpenDocument?.(doc.id)}
                          guest={guest}
                          onFavoriteChange={handleFavoriteChange}
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
                            favorite: favoriteIds.has(String(doc.id))
                          }}
                          onOpen={() => onOpenDocument?.(doc.id)}
                          guest={guest}
                          onFavoriteChange={handleFavoriteChange}
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
