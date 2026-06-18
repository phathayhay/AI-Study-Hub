import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { AdminApp } from './study-hub/admin'
import { LoginPage, RegisterPage } from './study-hub/auth'
import { LibraryPage } from './study-hub/library'
import { FilePreviewModal, NotificationPanel, ReportModal, SettingsModal, FeatureRequestModal, SupportModal, ChromeExtensionModal } from './study-hub/modals'
import {
  DocumentDetailPage, ExplorePage, FolderDetailPage, HomeScreen,
  PricingPage, ProfilePage, UploadPage,
} from './study-hub/public-pages'
import StudyDocumentApi from './study-hub/StudyDocumentApi'
import useAuth from '../hooks/useAuth'

const defaultStudyFile = {
  name: '漢字--JPD316 Lesson 5-NEW.pptx',
  attachmentName: 'BTVN-BAI_PART3.docx',
  subject: 'Japanese',
  content: '',
}

export default function StudyHubApp() {
  const { user, loading, login: authLogin, register: authRegister, logout: authLogout, setUser } = useAuth()
  const [route, setRoute] = useState('guest-home')
  const [previousRoute, setPreviousRoute] = useState('guest-home')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebarCollapsed', String(next))
      return next
    })
  }
  const role = user ? (user.role?.toUpperCase() === 'ADMIN' ? 'admin' : 'student') : null
  const guest = !user || !role
  const [libraryTab, setLibraryTab] = useState('sessions')
  const [studyTab, setStudyTab] = useState('original')
  const [studyMode, setStudyMode] = useState('default')
  const [uploadMode, setUploadMode] = useState('document')
  const [studyFile, setStudyFile] = useState(defaultStudyFile)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedDocId, setSelectedDocId] = useState(null)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFeatureRequest, setShowFeatureRequest] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [showExtension, setShowExtension] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [])


  useEffect(() => {
    if (guest) {
      const publicRoutes = ['guest-home', 'explore', 'folder-detail', 'doc-detail', 'pricing', 'login', 'register']
      if (!publicRoutes.includes(route)) {
        setRoute('login')
      }
    } else {
      const guestOnlyRoutes = ['guest-home', 'login', 'register']
      if (guestOnlyRoutes.includes(route)) {
        setRoute(role === 'admin' ? 'admin-overview' : 'home')
      }
    }
  }, [user, role, route])

  const navigate = (nextRoute) => {
    if (nextRoute === 'logout') { handleLogout(); return }
    if (nextRoute === 'settings') { setShowSettings(true); return }
    if (nextRoute === 'feature-request') { setShowFeatureRequest(true); return }
    if (nextRoute === 'support') { setShowSupport(true); return }
    if (nextRoute === 'chrome-extension') { setShowExtension(true); return }

    // Enforce route guards
    const hasToken = !!localStorage.getItem('accessToken')
    const isGuest = !user && !hasToken
    const publicRoutes = ['guest-home', 'explore', 'folder-detail', 'doc-detail', 'pricing', 'login', 'register']
    let targetBaseRoute = nextRoute
    if (nextRoute === 'new-study-session') {
      targetBaseRoute = 'upload'
    } else if (nextRoute === 'library-shared' || nextRoute === 'library-folders') {
      targetBaseRoute = 'library'
    }

    if (isGuest && !publicRoutes.includes(targetBaseRoute)) {
      setRoute('login')
      return
    }

    if (nextRoute === 'new-study-session') {
      setPreviousRoute(route)
      setUploadMode('study')
      setRoute('upload')
      setShowNotifications(false); setShowReport(false); setSelectedFile(null)
      return
    }
    if (nextRoute === 'library-shared') {
      setPreviousRoute(route)
      setRoute('library')
      setLibraryTab('shared')
      setShowNotifications(false); setShowReport(false); setSelectedFile(null)
      return
    }
    if (nextRoute === 'library-folders') {
      setPreviousRoute(route)
      setRoute('library')
      setLibraryTab('folders')
      setShowNotifications(false); setShowReport(false); setSelectedFile(null)
      return
    }
    setPreviousRoute(route)
    setRoute(nextRoute)
    setShowNotifications(false); setShowReport(false); setSelectedFile(null)
    if (nextRoute === 'upload') setUploadMode('document')
    if (nextRoute === 'library') setLibraryTab('recent')
    if (nextRoute === 'study') { setStudyTab('original'); setStudyMode('default') }
  }

  const handleLogin = async (res) => {
    const u = await authLogin(res)
    const r = u.role?.toUpperCase() === 'ADMIN' ? 'admin' : 'student'
    navigate(r === 'admin' ? 'admin-overview' : 'home')
  }

  const handleRegister = async (res) => {
    const u = await authRegister(res)
    const r = u.role?.toUpperCase() === 'ADMIN' ? 'admin' : 'student'
    navigate(r === 'admin' ? 'admin-overview' : 'home')
  }

  const handleLogout = async () => {
    await authLogout()
    navigate('guest-home')
  }

  const openStudyFile = (file) => {
    setStudyFile({
      id: file.id,
      name: file.name, attachmentName: file.name, subject: file.subject,
      content: '', sizeLabel: file.sizeLabel,
      fileUrl: file.fileUrl || '',
    })
    navigate('study')
  }

  const handleStudyUpload = (file) => {
    setStudyFile({
      id: file.id,
      name: file.name, attachmentName: file.attachmentName || file.name,
      subject: file.subject || '',
      content: file.content || '',
      sizeLabel: file.sizeLabel || '',
      fileUrl: file.fileUrl || '',
    })
    setUploadMode('document')
    navigate('study')
  }

  if (loading) return null

  if (route === 'login') return <LoginPage onLogin={handleLogin} onNavigate={navigate} />
  if (route === 'register') return <RegisterPage onRegister={handleRegister} onNavigate={navigate} />
  if (route.startsWith('admin-')) return <AdminApp route={route} onNavigate={navigate} onLogout={handleLogout} />

  const activeRoute = guest
    ? ['explore', 'folder-detail', 'doc-detail'].includes(route) ? 'explore' : 'guest-home'
    : route === 'folder-detail' ? 'explore'
    : route === 'library' ? (libraryTab === 'shared' ? 'library-shared' : libraryTab === 'folders' ? 'library-folders' : 'library')
    : route

  return (
    <AppLayout
      active={activeRoute} className={route === 'study' ? 'app-shell--study' : ''}
      guest={guest} user={user}
      title={route === 'study' ? studyFile?.name : null}
      onNavigate={navigate}
      onNotifications={() => setShowNotifications((open) => !open)}
      sidebarCollapsed={sidebarCollapsed}
      onToggleCollapse={toggleSidebar}
    >
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}

      {route === 'guest-home' && <HomeScreen guest={guest} onNavigate={navigate} />}
      {route === 'home' && <HomeScreen onNavigate={navigate} />}
      {route === 'explore' && <ExplorePage guest={guest} onNavigate={navigate} onOpenDocument={(id) => { setSelectedDocId(id); navigate('doc-detail') }} onOpenFolder={(id) => { setSelectedFolderId(id); navigate('folder-detail') }} />}
      {route === 'folder-detail' && <FolderDetailPage id={selectedFolderId} onNavigate={navigate} />}
      {route === 'library' && (
        <LibraryPage activeTab={libraryTab} onNavigate={navigate} onOpenFile={setSelectedFile} onTabChange={setLibraryTab} />
      )}
      {route === 'upload' && <UploadPage mode={uploadMode} onStudyFileUploaded={handleStudyUpload} onNavigate={navigate} />}
      {route === 'profile' && <ProfilePage />}
      {route === 'pricing' && <PricingPage onNavigate={navigate} />}
      {route === 'doc-detail' && (
        <DocumentDetailPage
          id={selectedDocId}
          guest={guest}
          onNavigate={navigate}
          onOpenStudyFile={openStudyFile}
          onBack={() => navigate(previousRoute || (role ? 'home' : 'guest-home'))}
          onReport={() => setShowReport(true)}
        />
      )}
      {route === 'study' && (
        <StudyDocumentApi
          activeTab={studyTab} file={studyFile}
          onBack={() => navigate(previousRoute || 'library')}
          onTabChange={(tab) => { setStudyTab(tab); setStudyMode('default') }}
        />
      )}

      {selectedFile && <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} onView={() => openStudyFile(selectedFile)} />}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} onUserUpdate={setUser} />}
      {showFeatureRequest && <FeatureRequestModal onClose={() => setShowFeatureRequest(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showExtension && <ChromeExtensionModal onClose={() => setShowExtension(false)} />}
    </AppLayout>
  )
}