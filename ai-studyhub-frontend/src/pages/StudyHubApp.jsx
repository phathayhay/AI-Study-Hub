import { useState } from 'react'
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
  UploadPage,
} from './study-hub/public-pages'
import { defaultStudyFile } from '../packages/mooc-data'
import { StudyDocumentPage } from './study-hub/study-document'

export default function StudyHubApp() {
  const [route, setRoute] = useState('guest-home')
  const [previousRoute, setPreviousRoute] = useState('guest-home')
  const [role, setRole] = useState(null)
  const [libraryTab, setLibraryTab] = useState('sessions')
  const [studyTab, setStudyTab] = useState('original')
  const [studyMode, setStudyMode] = useState('default')
  const [uploadMode, setUploadMode] = useState('document')
  const [studyFile, setStudyFile] = useState(defaultStudyFile)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const navigate = (nextRoute) => {
    if (nextRoute === 'new-study-session') {
      setPreviousRoute(route)
      setUploadMode('study')
      setRoute('upload')
      setShowNotifications(false)
      setShowReport(false)
      setSelectedFile(null)
      return
    }

    setPreviousRoute(route)
    setRoute(nextRoute)
    setShowNotifications(false)
    setShowReport(false)
    setSelectedFile(null)
    if (nextRoute === 'guest-home') setRole(null)
    if (nextRoute === 'upload') setUploadMode('document')
    if (nextRoute === 'library') setLibraryTab('sessions')
    if (nextRoute === 'study') {
      setStudyTab('original')
      setStudyMode('default')
    }
  }

  const handleLogin = (nextRole) => {
    setRole(nextRole)
    navigate(nextRole === 'admin' ? 'admin-overview' : 'home')
  }

  const openStudyFile = (file) => {
    setStudyFile({
      id: file.id,
      documentId: file.documentId ?? file.id,
      name: file.name,
      attachmentName: file.attachmentName ?? file.name,
      subject: file.subject,
      content: '',
      sizeLabel: file.sizeLabel,
      fileUrl: file.fileUrl,
    })
    navigate('study')
  }

  const handleStudyUpload = (file) => {
    setStudyFile(file)
    setUploadMode('document')
    navigate('study')
  }

  if (route === 'login') return <LoginPage onLogin={handleLogin} onNavigate={navigate} />
  if (route === 'register') return <RegisterPage onNavigate={navigate} />
  if (route.startsWith('admin-')) return <AdminApp route={route} onNavigate={navigate} />

  const guest = !role
  const activeRoute = guest
    ? ['explore', 'folder-detail', 'doc-detail'].includes(route) ? 'explore' : 'guest-home'
    : route === 'folder-detail' ? 'explore' : route

  return (
    <AppLayout
      active={activeRoute}
      className={route === 'study' ? 'app-shell--study' : ''}
      guest={guest}
      onNavigate={navigate}
      onNotifications={() => setShowNotifications((open) => !open)}
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
          onBack={() => navigate(previousRoute || (role ? 'home' : 'guest-home'))}
          onReport={() => setShowReport(true)}
        />
      )}
      {route === 'study' && (
        <StudyDocumentPage
          activeTab={studyTab}
          file={studyFile}
          mode={studyMode}
          onBack={() => navigate(previousRoute || 'library')}
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
