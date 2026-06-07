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
import { StudyDocumentPage } from './study-hub/study-document'

export default function StudyHubApp() {
  const [route, setRoute] = useState('admin-overview')
  const [libraryTab, setLibraryTab] = useState('sessions')
  const [studyTab, setStudyTab] = useState('original')
  const [studyMode, setStudyMode] = useState('default')
  const [selectedFile, setSelectedFile] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const navigate = (nextRoute) => {
    setRoute(nextRoute)
    setShowNotifications(false)
    setShowReport(false)
    setSelectedFile(null)
    if (nextRoute === 'library') setLibraryTab('sessions')
    if (nextRoute === 'study') {
      setStudyTab('original')
      setStudyMode('default')
    }
  }

  if (route === 'login') return <LoginPage onNavigate={navigate} />
  if (route === 'register') return <RegisterPage onNavigate={navigate} />
  if (route.startsWith('admin-')) return <AdminApp route={route} onNavigate={navigate} />

  const guest = route === 'guest-home'
  const activeRoute = guest ? 'guest-home' : route === 'folder-detail' ? 'explore' : route

  return (
    <AppLayout
      active={activeRoute}
      className={route === 'study' ? 'app-shell--study' : ''}
      guest={guest}
      onNavigate={navigate}
      onNotifications={() => setShowNotifications((open) => !open)}
    >
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}

      {route === 'guest-home' && <HomeScreen guest onNavigate={navigate} />}
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
      {route === 'upload' && <UploadPage />}
      {route === 'profile' && <ProfilePage />}
      {route === 'pricing' && <PricingPage onNavigate={navigate} />}
      {route === 'doc-detail' && <DocumentDetailPage onReport={() => setShowReport(true)} />}
      {route === 'study' && (
        <StudyDocumentPage
          activeTab={studyTab}
          mode={studyMode}
          onModeChange={setStudyMode}
          onTabChange={(tab) => {
            setStudyTab(tab)
            setStudyMode('default')
          }}
        />
      )}

      {selectedFile && <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} onView={() => navigate('study')} />}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </AppLayout>
  )
}
