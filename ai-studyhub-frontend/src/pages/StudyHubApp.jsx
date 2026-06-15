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
      : requestedPath && !requestedPath.startsWith('/admin') ? requestedPath : ROUTES.HOME
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
          onOpenFile={setSelectedFile}
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
          onBack={() => navigateBack(routerNavigate, location.state?.from, ROUTES.HOME)}
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

function formatFileSize(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}
