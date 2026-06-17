import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { AdminApp } from './study-hub/admin'
import { LoginPage, RegisterPage } from './study-hub/auth'
import { LibraryPage } from './study-hub/library'
import { FilePreviewModal, NotificationPanel, ReportModal } from './study-hub/modals'
import {
  DocumentDetailPage,
  ExplorePage,
  FolderDetailPage,
  HomeScreen,
  PricingPage,
  ProfilePage,
} from './study-hub/public-pages'
import { getStoredUser, logout } from '../features/auth/authService'
import { getDocumentDetails } from '../services/documentService'
import { fillRoute, ROUTES, ROUTE_PATHS } from '../constants/routes'
import UploadPage from './study-hub/UploadPageApi'
import StudyDocumentPage from './study-hub/StudyDocumentApi'
import NotFound from './NotFound'

const defaultStudyFile = {
  name: '漢字--JPD316 Lesson 5-NEW.pptx',
  attachmentName: 'BTVN-BAI_PART3.docx',
  subject: 'Japanese',
  content: '',
}

const protectedRoutes = new Set(['library', 'upload', 'profile', 'pricing', 'study'])

export default function StudyHubApp({ notFound = false }) {
  const location = useLocation()
  const routerNavigate = useNavigate()
  const params = useParams()
  const storedUser = getStoredUser()
  const [role, setRole] = useState(() => mapRole(storedUser?.role))
  const [authUser, setAuthUser] = useState(storedUser)
  const [libraryTab, setLibraryTab] = useState('sessions')
  const [studyTab, setStudyTab] = useState('original')
  const [studyMode, setStudyMode] = useState('default')
  const [studyFile, setStudyFile] = useState(() => location.state?.file ?? {
    ...defaultStudyFile,
    id: params.documentId,
    documentId: params.documentId,
  })
  const [detailFile, setDetailFile] = useState(() => location.state?.file ?? null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const route = notFound ? 'not-found' : getRouteFromPath(location.pathname, role)
  const uploadMode = location.pathname === ROUTES.NEW_STUDY_SESSION ? 'study' : 'document'
  const activeStudyFile = location.state?.file ?? (
    String(studyFile.documentId) === params.documentId
      ? studyFile
      : { ...defaultStudyFile, id: params.documentId, documentId: params.documentId }
  )

  useEffect(() => {
    if (route !== 'study' || !params.documentId) return undefined
    if (location.state?.file) return undefined

    let active = true
    getDocumentDetails(params.documentId)
      .then((document) => {
        if (active) setStudyFile(mapStudyDocument(document))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [location.state, params.documentId, route])

  useEffect(() => {
    if (route !== 'doc-detail' || !params.documentId || params.documentId === 'featured') return undefined

    if (location.state?.file) {
      setDetailFile(location.state.file)
      return undefined
    }

    let active = true
    setDetailFile(createLoadingPublicDocument(params.documentId))
    getDocumentDetails(params.documentId)
      .then((document) => {
        if (active) setDetailFile(mapPublicDocument(document))
      })
      .catch(() => {
        if (active) setDetailFile(createUnavailablePublicDocument(params.documentId))
      })
    return () => {
      active = false
    }
  }, [location.state, params.documentId, route])

  const navigate = (nextRoute) => {
    setShowNotifications(false)
    setShowReport(false)
    setSelectedFile(null)

    if (nextRoute === 'new-study-session') {
      routerNavigate(ROUTES.NEW_STUDY_SESSION, { state: { from: location.pathname } })
      return
    }

    if (nextRoute === 'library') setLibraryTab('sessions')
    if (nextRoute === 'study') {
      setStudyTab('original')
      setStudyMode('default')
    }
    const path = getPathForRoute(nextRoute)
    routerNavigate(path, { state: { from: location.pathname } })
  }

  const handleLogin = (session) => {
    const nextRole = mapRole(session.role)
    setRole(nextRole)
    setAuthUser(session)
    const requestedPath = location.state?.from
    const nextPath = nextRole === 'admin'
      ? ROUTES.ADMIN_OVERVIEW
      : isPostLoginRedirectPath(requestedPath) ? requestedPath : ROUTES.HOME
    routerNavigate(nextPath, { replace: true })
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setRole(null)
      setAuthUser(null)
      routerNavigate(ROUTES.HOME, { replace: true })
    }
  }

  const openStudyFile = (file) => {
    const nextFile = {
      id: file.id,
      documentId: file.documentId ?? file.id,
      name: file.name,
      attachmentName: file.attachmentName ?? file.name,
      subject: file.subject,
      content: '',
      sizeLabel: file.sizeLabel,
      fileUrl: file.fileUrl,
    }
    setSelectedFile(null)
    setStudyFile(nextFile)
    routerNavigate(
      fillRoute(ROUTES.STUDY_DOCUMENT, { documentId: nextFile.documentId }),
      { state: { file: nextFile, from: location.pathname } },
    )
  }

  const openLibraryFile = (file) => {
    if (file.public) {
      const nextFile = mapLibraryPublicDocument(file)
      setSelectedFile(null)
      setDetailFile(nextFile)
      routerNavigate(
        fillRoute(ROUTES.DOCUMENT_DETAIL, { documentId: nextFile.documentId }),
        { state: { file: nextFile, from: location.pathname } },
      )
      return
    }

    setSelectedFile(file)
  }

  const openDetailStudyFile = (document) => {
    const nextFile = mapPublicStudyDocument(document)
    setStudyTab('original')
    setStudyMode('default')
    setStudyFile(nextFile)
    routerNavigate(
      fillRoute(ROUTES.STUDY_DOCUMENT, { documentId: nextFile.documentId }),
      { state: { file: nextFile, from: location.pathname } },
    )
  }

  const handleStudyUpload = (file) => {
    setStudyFile(file)
    routerNavigate(
      fillRoute(ROUTES.STUDY_DOCUMENT, { documentId: file.documentId ?? file.id }),
      { replace: true, state: { file, from: ROUTES.LIBRARY } },
    )
  }

  if (route === 'not-found') return <NotFound />
  if (route.startsWith('admin-') && role !== 'admin') {
    return <Navigate replace state={{ from: location.pathname }} to={role ? ROUTES.HOME : ROUTES.LOGIN} />
  }
  if (protectedRoutes.has(route) && !role) {
    return <Navigate replace state={{ from: location.pathname }} to={ROUTES.LOGIN} />
  }
  if (route === 'login') return <LoginPage onLogin={handleLogin} onNavigate={navigate} />
  if (route === 'register') return <RegisterPage onNavigate={navigate} onRegister={handleLogin} />
  if (route.startsWith('admin-')) {
    return <AdminApp onLogout={handleLogout} route={route} onNavigate={navigate} />
  }

  const guest = !role
  const activeRoute = guest
    ? ['explore', 'folder-detail', 'doc-detail'].includes(route) ? 'explore' : 'guest-home'
    : route === 'folder-detail' ? 'explore' : route

  return (
    <AppLayout
      active={activeRoute}
      className={route === 'study' ? 'app-shell--study' : ''}
      guest={guest}
      user={authUser}
      onNavigate={navigate}
      onNotifications={() => setShowNotifications((open) => !open)}
      onLogout={handleLogout}
    >
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}

      {route === 'guest-home' && <HomeScreen guest={guest} onNavigate={navigate} />}
      {route === 'home' && <HomeScreen onNavigate={navigate} />}
      {route === 'explore' && <ExplorePage onNavigate={navigate} />}
      {route === 'folder-detail' && <FolderDetailPage onNavigate={navigate} />}
      {route === 'library' && (
        <LibraryPage
          activeTab={libraryTab}
          onNavigate={navigate}
          onOpenFile={openLibraryFile}
          onTabChange={setLibraryTab}
        />
      )}
      {route === 'upload' && (
        <UploadPage
          mode={uploadMode}
          onStudyFileUploaded={handleStudyUpload}
        />
      )}
      {route === 'profile' && <ProfilePage />}
      {route === 'pricing' && <PricingPage onNavigate={navigate} />}
      {route === 'doc-detail' && (
        <DocumentDetailPage
          document={params.documentId === 'featured' ? null : detailFile}
          onBack={() => navigateBack(routerNavigate, location.state?.from, ROUTES.HOME)}
          onChat={openDetailStudyFile}
          onReport={() => setShowReport(true)}
        />
      )}
      {route === 'study' && (
        <StudyDocumentPage
          activeTab={studyTab}
          file={activeStudyFile}
          mode={studyMode}
          onBack={() => navigateBack(routerNavigate, location.state?.from, ROUTES.LIBRARY)}
          onModeChange={setStudyMode}
          onTabChange={(tab) => {
            setStudyTab(tab)
            setStudyMode('default')
          }}
        />
      )}

      {selectedFile && <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} onView={() => openStudyFile(selectedFile)} />}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </AppLayout>
  )
}

function mapRole(role) {
  if (!role) return null
  return role.toUpperCase() === 'ADMIN' ? 'admin' : 'student'
}

function isPostLoginRedirectPath(path) {
  return Boolean(path)
    && path !== ROUTES.LOGIN
    && path !== ROUTES.REGISTER
    && !path.startsWith('/admin')
}

function getRouteFromPath(pathname, role) {
  const path = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname
  const routesByPath = {
    [ROUTES.HOME]: role ? 'home' : 'guest-home',
    [ROUTES.LOGIN]: 'login',
    [ROUTES.REGISTER]: 'register',
    [ROUTES.EXPLORE]: 'explore',
    [ROUTES.LIBRARY]: 'library',
    [ROUTES.UPLOAD]: 'upload',
    [ROUTES.NEW_STUDY_SESSION]: 'upload',
    [ROUTES.PROFILE]: 'profile',
    [ROUTES.PRICING]: 'pricing',
    [ROUTES.ADMIN_OVERVIEW]: 'admin-overview',
    [ROUTES.ADMIN_USERS]: 'admin-users',
    [ROUTES.ADMIN_DOCUMENTS]: 'admin-documents',
    [ROUTES.ADMIN_COURSES]: 'admin-courses',
    [ROUTES.ADMIN_STORAGE]: 'admin-storage',
    [ROUTES.ADMIN_REPORTS]: 'admin-reports',
    [ROUTES.ADMIN_LOGS]: 'admin-logs',
    [ROUTES.ADMIN_SETTINGS]: 'admin-settings',
  }

  if (routesByPath[path]) return routesByPath[path]
  if (/^\/folders\/[^/]+$/.test(path)) return 'folder-detail'
  if (/^\/documents\/[^/]+$/.test(path)) return 'doc-detail'
  if (/^\/study\/[^/]+$/.test(path)) return 'study'
  return 'not-found'
}

function getPathForRoute(route) {
  if (route === 'folder-detail') return fillRoute(ROUTES.FOLDER_DETAIL, { folderId: 'featured' })
  if (route === 'doc-detail') return fillRoute(ROUTES.DOCUMENT_DETAIL, { documentId: 'featured' })
  return ROUTE_PATHS[route] ?? ROUTES.HOME
}

function navigateBack(navigate, previousPath, fallbackPath) {
  navigate(previousPath || fallbackPath)
}

function mapStudyDocument(document) {
  return {
    id: document.id,
    documentId: document.id,
    name: document.title || document.fileName,
    attachmentName: document.fileName,
    subject: document.description || document.fileType,
    sizeLabel: formatFileSize(document.fileSize),
    fileUrl: document.fileUrl,
    content: '',
  }
}

function mapPublicDocument(document) {
  return {
    id: document.id,
    documentId: document.id,
    code: document.courseCode || document.tags?.[0] || document.fileType || 'Tài liệu',
    type: document.fileType?.toLowerCase() || 'document',
    title: document.title || document.fileName,
    description: document.description || 'Tài liệu học tập được chia sẻ trên diễn đàn.',
    downloads: document.totalDownloads ?? 0,
    views: document.totalViews ?? 0,
    rating: document.averageRating ?? '0',
    uploader: document.uploaderName || `User #${document.userId ?? ''}`.trim(),
    date: formatApiDate(document.createdAt),
    subject: document.courseName || document.description || document.fileType || 'Tài liệu',
    favorite: Boolean(document.favorite),
    fileUrl: document.fileUrl,
  }
}

function mapLibraryPublicDocument(file) {
  return {
    id: file.id,
    documentId: file.documentId ?? file.id,
    code: file.subject?.split(',')[0] || file.kind || 'Tài liệu',
    type: file.kind || 'document',
    title: file.name,
    description: file.subject || 'Tài liệu học tập được chia sẻ trên diễn đàn.',
    downloads: 0,
    views: 0,
    rating: '0',
    uploader: 'Bạn',
    date: file.date,
    subject: file.subject || file.kind || 'Tài liệu',
    favorite: Boolean(file.favorite),
    fileUrl: file.fileUrl,
  }
}

function mapPublicStudyDocument(document) {
  const documentId = document?.documentId ?? document?.id ?? 'featured'
  const name = document?.title || document?.name || 'Tài liệu'

  return {
    id: documentId,
    documentId,
    name,
    attachmentName: document?.attachmentName || name,
    subject: document?.subject || document?.description || document?.code || 'Tài liệu',
    content: '',
    sizeLabel: document?.sizeLabel,
    fileUrl: document?.fileUrl,
  }
}

function createLoadingPublicDocument(documentId) {
  return {
    id: documentId,
    documentId,
    code: 'Tài liệu',
    type: 'document',
    title: 'Đang tải tài liệu...',
    description: '',
    downloads: 0,
    views: 0,
    rating: '0',
    uploader: '',
    date: '',
    subject: 'Tài liệu',
    favorite: false,
  }
}

function createUnavailablePublicDocument(documentId) {
  return {
    ...createLoadingPublicDocument(documentId),
    title: 'Không thể tải tài liệu',
    description: 'Tài liệu có thể không tồn tại hoặc bạn không có quyền truy cập.',
  }
}

function formatApiDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value))
}

function formatFileSize(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}
