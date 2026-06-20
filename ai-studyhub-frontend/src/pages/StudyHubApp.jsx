import { useState, useEffect } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { AdminApp } from './study-hub/admin'
import { LoginPage, RegisterPage } from './study-hub/auth'
import { LibraryPage } from './study-hub/library'
import { NotificationPanel, ReportModal, SettingsModal, FeatureRequestModal, SupportModal, ChromeExtensionModal } from './study-hub/modals'
import {
  DocumentDetailPage, ExplorePage, FolderDetailPage, HomeScreen,
  PricingPage, ProfilePage, UploadPage,
} from './study-hub/public-pages'
import StudyDocumentApi from './study-hub/StudyDocumentApi'
import useAuth from '../hooks/useAuth'
import { getFolder } from '../features/folders/folderService'
import { getDocument } from '../features/documents/documentService'
import { register as apiRegister } from '../features/auth/authService'
import { ROUTES, ROUTE_PATHS, fillRoute } from '../constants/routes'

const defaultStudyFile = {
  name: '漢字--JPD316 Lesson 5-NEW.pptx',
  attachmentName: 'BTVN-BAI_PART3.docx',
  subject: 'Japanese',
  content: '',
}

const getUserRole = (user) => {
  const rawRole = user?.role || user?.roleName || user?.authority || ''
  const role = String(rawRole).toUpperCase()
  if (role.includes('ADMIN')) return 'admin'
  if (role) return 'student'
  return null
}

export default function StudyHubApp() {
  const location = useLocation()
  const routerNavigate = useNavigate()
  const { user, loading, login: authLogin, register: authRegister, logout: authLogout, setUser } = useAuth()
  const [route, setRoute] = useState('explore')
  const [previousRoute, setPreviousRoute] = useState('explore')
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
  const role = user ? getUserRole(user) : null
  const guest = !user || !role
  const [libraryTab, setLibraryTab] = useState('sessions')
  const [studyTab, setStudyTab] = useState('original')
  const [studyMode, setStudyMode] = useState('default')
  const [uploadMode, setUploadMode] = useState('document')
  const [studyFile, setStudyFile] = useState(defaultStudyFile)
  const [selectedDocId, setSelectedDocId] = useState(null)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFeatureRequest, setShowFeatureRequest] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [showExtension, setShowExtension] = useState(false)
  const [studyBreadcrumbs, setStudyBreadcrumbs] = useState([])
  const [initialFolderId, setInitialFolderId] = useState(null)
  const [toast, setToast] = useState(null)
  const [currentDoc, setCurrentDoc] = useState(null)
  const [currentFolder, setCurrentFolder] = useState(null)
  const [docBreadcrumbs, setDocBreadcrumbs] = useState([])

  const getPathForRoute = (nextRoute, params = {}) => {
    if (nextRoute === 'folder-detail') {
      const folderId = params.folderId ?? params.id ?? selectedFolderId
      return folderId ? fillRoute(ROUTES.FOLDER_DETAIL, { folderId }) : ROUTES.EXPLORE
    }
    if (nextRoute === 'doc-detail') {
      const documentId = params.documentId ?? params.id ?? selectedDocId
      return documentId ? fillRoute(ROUTES.DOCUMENT_DETAIL, { documentId }) : ROUTES.EXPLORE
    }
    if (nextRoute === 'study') {
      const documentId = params.documentId ?? params.id ?? params.file?.id ?? studyFile?.id
      return documentId ? fillRoute(ROUTES.STUDY_DOCUMENT, { documentId }) : ROUTES.NEW_STUDY_SESSION
    }
    if (nextRoute === 'new-study-session') return ROUTES.NEW_STUDY_SESSION
    return ROUTE_PATHS[nextRoute] || ROUTE_PATHS.explore
  }

  const pushPath = (nextRoute, params = {}, replace = false) => {
    const nextPath = getPathForRoute(nextRoute, params)
    if (nextPath && nextPath !== location.pathname) {
      routerNavigate(nextPath, { replace })
    }
  }

  useEffect(() => {
    const resolved = resolveRoute(location.pathname)
    setRoute(resolved.route)

    if (resolved.libraryTab) setLibraryTab(resolved.libraryTab)
    if (resolved.uploadMode) setUploadMode(resolved.uploadMode)

    const folderId = resolved.params?.folderId
    if (folderId) setSelectedFolderId(Number(folderId))

    const documentId = resolved.params?.documentId
    if (documentId) {
      const numericDocumentId = Number(documentId)
      setSelectedDocId(numericDocumentId)
      if (resolved.route === 'study') {
        setStudyFile((current) => {
          if (String(current?.id) === String(documentId)) return current
          return {
            ...defaultStudyFile,
            id: numericDocumentId,
            documentId: numericDocumentId,
            name: `Document #${documentId}`,
            attachmentName: `Document #${documentId}`,
          }
        })
        setStudyTab('original')
        setStudyMode('default')
      }
    }
  }, [location.pathname])

  useEffect(() => {
    window.showToast = (message, type = 'success') => {
      setToast({ message, type })
    }
    return () => {
      delete window.showToast
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    const body = document.querySelector('.app-shell__body')
    if (body) body.scrollTop = 0
    const main = document.querySelector('main')
    if (main) main.scrollTop = 0
  }, [route, selectedDocId, selectedFolderId])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => {
      setToast(null)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (route !== 'study' || !studyFile?.id) {
      setStudyBreadcrumbs([])
      return undefined
    }

    let isMounted = true

    const fetchBreadcrumbs = async () => {
      try {
        let folderId = studyFile.folderId
        
        // If folderId is not present, fetch document details first
        if (folderId === undefined || folderId === null) {
          const docRes = await getDocument(studyFile.id)
          const docData = docRes?.data || docRes
          folderId = docData?.folderId
        }

        if (!folderId) {
          if (isMounted) setStudyBreadcrumbs([])
          return
        }

        // Fetch parent folders recursively
        const path = []
        let currentFolderId = folderId
        while (currentFolderId) {
          const folderRes = await getFolder(currentFolderId)
          const folder = folderRes?.data || folderRes
          if (folder) {
            path.unshift({
              id: folder.id,
              name: folder.folderName || folder.name || 'Untitled Folder'
            })
            currentFolderId = folder.parentFolderId
          } else {
            break
          }
        }

        if (isMounted) {
          setStudyBreadcrumbs(path)
        }
      } catch (e) {
        console.error('Error fetching study breadcrumbs:', e)
        if (isMounted) setStudyBreadcrumbs([])
      }
    }

    fetchBreadcrumbs()

    return () => {
      isMounted = false
    }
  }, [studyFile?.id, route])

  useEffect(() => {
    if (route !== 'doc-detail' || !currentDoc?.folderId) {
      setDocBreadcrumbs([])
      return undefined
    }

    let isMounted = true

    const fetchDocBreadcrumbs = async () => {
      try {
        const folderId = currentDoc.folderId
        const path = []
        let currentFolderId = folderId
        
        while (currentFolderId) {
          const folderRes = await getFolder(currentFolderId)
          const folder = folderRes?.data || folderRes
          if (folder) {
            path.unshift({
              id: folder.id,
              name: folder.folderName || folder.name || 'Untitled Folder'
            })
            currentFolderId = folder.parentFolderId
          } else {
            break
          }
        }
        
        if (isMounted) {
          setDocBreadcrumbs(path)
        }
      } catch (e) {
        console.error('Error fetching doc breadcrumbs:', e)
        if (isMounted) setDocBreadcrumbs([])
      }
    }

    fetchDocBreadcrumbs()

    return () => {
      isMounted = false
    }
  }, [currentDoc?.folderId, route])

  const handleBreadcrumbClick = (id) => {
    if (id === 'explore') {
      navigate('explore')
    } else if (id === 'library') {
      navigate('library')
    } else if (id === null) {
      setInitialFolderId(null)
      setLibraryTab('folders')
      navigate('library')
    } else if (typeof id === 'number' || !isNaN(Number(id))) {
      if (route === 'doc-detail') {
        setSelectedFolderId(Number(id))
        navigate('folder-detail', { folderId: id })
      } else {
        setInitialFolderId(Number(id))
        setLibraryTab('folders')
        navigate('library')
      }
    }
  }

  const [recentItems, setRecentItems] = useState([])

  useEffect(() => {
    const key = user ? `recentItems_${user.id || user.email || 'user'}` : 'recentItems_guest'
    try {
      const saved = localStorage.getItem(key)
      setRecentItems(saved ? JSON.parse(saved) : [])
    } catch (e) {
      setRecentItems([])
    }
  }, [user])

  const addRecentItem = (item) => {
    if (!item || !item.id || !item.name) return
    setRecentItems(prev => {
      const filtered = prev.filter(x => !(String(x.id) === String(item.id) && x.type === item.type))
      const updated = [
        { id: item.id, type: item.type, name: item.name, target: item.target, params: item.params, timestamp: Date.now() },
        ...filtered
      ].slice(0, 10)
      const key = user ? `recentItems_${user.id || user.email || 'user'}` : 'recentItems_guest'
      localStorage.setItem(key, JSON.stringify(updated))
      return updated
    })
  }

  // Remove recent item by id (string-safe comparison). If type is omitted, removes all entries with that id.
  const removeRecentItem = (id, type) => {
    setRecentItems(prev => {
      const filtered = type
        ? prev.filter(x => !(String(x.id) === String(id) && x.type === type))
        : prev.filter(x => String(x.id) !== String(id))
      const key = user ? `recentItems_${user.id || user.email || 'user'}` : 'recentItems_guest'
      localStorage.setItem(key, JSON.stringify(filtered))
      return filtered
    })
  }

  // Remove all recent items whose IDs are NOT in existingIds (to purge stale/deleted items)
  const purgeStaleRecentItems = (existingIds) => {
    if (!existingIds || !existingIds.length) return
    const idSet = new Set(existingIds.map(String))
    setRecentItems(prev => {
      // Only purge 'file' type items; keep folders, etc. as-is (they have their own cleanup)
      const filtered = prev.filter(x => x.type !== 'file' || idSet.has(String(x.id)))
      if (filtered.length !== prev.length) {
        const key = user ? `recentItems_${user.id || user.email || 'user'}` : 'recentItems_guest'
        localStorage.setItem(key, JSON.stringify(filtered))
        return filtered
      }
      return prev
    })
  }

  const handleOpenRecentItem = (item) => {
    if (item.target === 'folder-detail') {
      setSelectedFolderId(item.id)
      navigate('folder-detail', { folderId: item.id })
    } else if (item.target === 'doc-detail') {
      setSelectedDocId(item.id)
      navigate('doc-detail', { documentId: item.id })
    } else if (item.target === 'study') {
      openStudyFile(item.params.file)
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [])


  useEffect(() => {
    const isAdminRoute = route.startsWith('admin-')
    if (guest) {
      const publicRoutes = ['explore', 'folder-detail', 'doc-detail', 'pricing', 'login', 'register']
      if (!publicRoutes.includes(route)) {
        setRoute('login')
        pushPath('login', {}, true)
      }
    } else if (isAdminRoute && role !== 'admin') {
      window.showToast?.('Admin access is required', 'error')
      setRoute('explore')
      pushPath('explore', {}, true)
    } else {
      const guestOnlyRoutes = ['login', 'register']
      if (guestOnlyRoutes.includes(route)) {
        const nextRoute = role === 'admin' ? 'admin-overview' : 'explore'
        setRoute(nextRoute)
        pushPath(nextRoute, {}, true)
      }
    }
  }, [user, role, route])

  const navigate = (nextRoute, params = {}) => {
    if (nextRoute === 'logout') { handleLogout(); return }
    if (nextRoute === 'settings') { setShowSettings(true); return }
    if (nextRoute === 'feature-request') { setShowFeatureRequest(true); return }
    if (nextRoute === 'support') { setShowSupport(true); return }
    if (nextRoute === 'chrome-extension') { setShowExtension(true); return }

    if (nextRoute !== 'doc-detail') setCurrentDoc(null)
    if (nextRoute !== 'folder-detail') setCurrentFolder(null)

    // Enforce route guards
    const hasToken = !!localStorage.getItem('accessToken')
    const isGuest = !user && !hasToken
    const publicRoutes = ['explore', 'folder-detail', 'doc-detail', 'pricing', 'login', 'register']
    let targetBaseRoute = nextRoute
    if (nextRoute === 'new-study-session') {
      targetBaseRoute = 'upload'
    } else if (nextRoute === 'library-shared' || nextRoute === 'library-folders' || nextRoute === 'library-recent' || nextRoute === 'library-favorites') {
      targetBaseRoute = 'library'
    }

    if (isGuest && !publicRoutes.includes(targetBaseRoute)) {
      setRoute('login')
      pushPath('login')
      return
    }

    if (targetBaseRoute.startsWith('admin-') && role !== 'admin') {
      window.showToast?.('Admin access is required', 'error')
      const fallbackRoute = guest ? 'login' : 'explore'
      setRoute(fallbackRoute)
      pushPath(fallbackRoute)
      return
    }

    if (nextRoute === 'new-study-session') {
      setPreviousRoute(route)
      setUploadMode('study')
      setRoute('upload')
      pushPath('new-study-session')
      setShowNotifications(false); setShowReport(false)
      return
    }
    if (nextRoute === 'library-shared') {
      setPreviousRoute(route)
      setRoute('library')
      setLibraryTab('shared')
      pushPath('library-shared')
      setShowNotifications(false); setShowReport(false)
      return
    }
    if (nextRoute === 'library-folders') {
      setPreviousRoute(route)
      setRoute('library')
      setLibraryTab('folders')
      pushPath('library-folders')
      setShowNotifications(false); setShowReport(false)
      return
    }
    if (nextRoute === 'library-recent') {
      setPreviousRoute(route)
      setRoute('library')
      setLibraryTab('recent')
      pushPath('library-recent')
      setShowNotifications(false); setShowReport(false)
      return
    }
    if (nextRoute === 'library-favorites') {
      setPreviousRoute(route)
      setRoute('library')
      setLibraryTab('favorites')
      pushPath('library-favorites')
      setShowNotifications(false); setShowReport(false)
      return
    }
    setPreviousRoute(route)
    setRoute(nextRoute)
    pushPath(nextRoute, params)
    setShowNotifications(false); setShowReport(false)
    if (nextRoute === 'upload') setUploadMode('document')
    if (nextRoute === 'library') setLibraryTab('sessions')
    if (nextRoute === 'study') { setStudyTab('original'); setStudyMode('default') }
  }

  const migrateGuestHistoryToUser = (userId) => {
    try {
      const guestKey = 'recentItems_guest'
      const userKey = `recentItems_${userId}`
      const guestSaved = localStorage.getItem(guestKey)
      if (guestSaved) {
        const guestItems = JSON.parse(guestSaved)
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          const userSaved = localStorage.getItem(userKey)
          const userItems = userSaved ? JSON.parse(userSaved) : []
          
          // Merge guest items into user items, avoiding duplicates
          const merged = [...userItems]
          guestItems.forEach(gItem => {
            const exists = merged.some(uItem => uItem.id === gItem.id && uItem.type === gItem.type)
            if (!exists) {
              merged.push(gItem)
            }
          })
          
          const updated = merged
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 10)
            
          localStorage.setItem(userKey, JSON.stringify(updated))
        }
      }
      localStorage.removeItem(guestKey)
    } catch (e) {
      console.error('Error migrating guest history:', e)
    }
  }

  const handleLogin = async (res) => {
    const u = await authLogin(res)
    if (u) {
      migrateGuestHistoryToUser(u.id || u.email || 'user')
    }
    const r = getUserRole(u) || 'student'
    navigate(r === 'admin' ? 'admin-overview' : 'explore')
  }

  const handleRegister = async (formData) => {
    const session = await apiRegister(formData)
    const u = await authRegister(session)
    if (u) {
      migrateGuestHistoryToUser(u.id || u.email || 'user')
      window.showToast?.('Registration successful! Welcome to AI Study Hub 🎉', 'success')
      navigate('explore')
    } else {
      throw new Error('Failed to save login session. Please try again.')
    }
  }

  const handleLogout = async () => {
    await authLogout()
    try { localStorage.removeItem('recentItems_guest') } catch (e) {}
    navigate('explore')
  }

  const openStudyFile = (file) => {
    const activeFile = {
      id: file.id,
      name: file.name, attachmentName: file.name, subject: file.subject,
      content: '', sizeLabel: file.sizeLabel,
      fileUrl: file.fileUrl || '',
      visibility: file.visibility || 'PRIVATE',
    }
    setStudyFile(activeFile)
    addRecentItem({
      id: file.id,
      type: 'file',
      name: file.name,
      target: 'study',
      params: { file: activeFile }
    })
    navigate('study', { documentId: file.id, file: activeFile })
  }

  const handleStudyUpload = (file) => {
    const activeFile = {
      id: file.id,
      name: file.name, attachmentName: file.attachmentName || file.name,
      subject: file.subject || '',
      content: file.content || '',
      sizeLabel: file.sizeLabel || '',
      fileUrl: file.fileUrl || '',
      visibility: file.visibility || 'PRIVATE',
    }
    setStudyFile(activeFile)
    addRecentItem({
      id: file.id,
      type: 'file',
      name: file.name,
      target: 'study',
      params: { file: activeFile }
    })
    setUploadMode('document')
    navigate('study', { documentId: file.id, file: activeFile })
  }

  if (loading) return null

  if (route === 'login') return <LoginPage onLogin={handleLogin} onNavigate={navigate} />
  if (route === 'register') return <RegisterPage onRegister={handleRegister} onNavigate={navigate} />
  if (route.startsWith('admin-')) {
    if (role !== 'admin') return null
    return <AdminApp route={route} onNavigate={navigate} onLogout={handleLogout} />
  }

  const activeRoute = ['explore', 'folder-detail', 'doc-detail'].includes(route) ? 'explore'
    : route === 'library' ? (libraryTab === 'shared' ? 'library-shared' : libraryTab === 'folders' ? 'library-folders' : libraryTab === 'favorites' ? 'library-favorites' : 'library')
    : route

  const appTitle = route === 'doc-detail' ? (currentDoc?.title || 'Loading document...')
    : route === 'folder-detail' ? (currentFolder?.folderName || currentFolder?.name || 'Loading folder...')
    : route === 'study' ? studyFile?.name
    : null

  const appBreadcrumbs = route === 'folder-detail'
    ? [{ id: 'explore', name: 'Explore' }]
    : route === 'doc-detail'
    ? [{ id: 'explore', name: 'Explore' }, ...docBreadcrumbs]
    : route === 'study'
    ? [{ id: 'library', name: 'Library' }, ...studyBreadcrumbs]
    : []

  return (
    <AppLayout
      active={activeRoute} className={route === 'study' ? 'app-shell--study' : ''}
      guest={guest} user={user}
      title={appTitle}
      onNavigate={navigate}
      onNotifications={() => setShowNotifications((open) => !open)}
      sidebarCollapsed={sidebarCollapsed}
      onToggleCollapse={toggleSidebar}
      recentItems={recentItems}
      onOpenRecentItem={handleOpenRecentItem}
      activeItemContext={{ route, studyFileId: studyFile?.id, selectedDocId, selectedFolderId }}
      breadcrumbs={appBreadcrumbs}
      onBreadcrumbClick={handleBreadcrumbClick}
      visibility={route === 'study' ? studyFile?.visibility : null}
      route={route}
      onRenameTitle={(newName) => {
        if (!studyFile?.id) return
        try {
          const localRenames = JSON.parse(localStorage.getItem('renamedDocs') || '{}')
          localRenames[studyFile.id] = newName
          localStorage.setItem('renamedDocs', JSON.stringify(localRenames))
          
          setStudyFile(prev => ({ ...prev, name: newName }))
          window.showToast?.('Document renamed successfully', 'success')
        } catch (e) {
          console.error(e)
          window.showToast?.('Failed to rename document', 'error')
        }
      }}
    >
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}

      {route === 'explore' && <ExplorePage guest={guest} onNavigate={navigate} onOpenDocument={(id) => { setSelectedDocId(id); navigate('doc-detail', { documentId: id }) }} onOpenFolder={(id) => { setSelectedFolderId(id); navigate('folder-detail', { folderId: id }) }} />}
      {route === 'folder-detail' && (
        <FolderDetailPage 
          id={selectedFolderId} 
          guest={guest}
          onNavigate={navigate} 
          onOpenDocument={(id) => { setSelectedDocId(id); navigate('doc-detail', { documentId: id }) }}
          onLoad={(folder) => {
            setCurrentFolder(folder)
            addRecentItem({
              id: folder.id || selectedFolderId,
              type: 'folder',
              name: folder.folderName || folder.name || 'Untitled Folder',
              target: 'folder-detail',
              params: { id: folder.id || selectedFolderId }
            })
          }}
        />
      )}
      {route === 'library' && (
      <LibraryPage
        activeTab={libraryTab}
        onNavigate={navigate}
        onOpenFile={openStudyFile}
        onTabChange={setLibraryTab}
        user={user}
        onRemoveRecentItem={removeRecentItem}
        onPurgeStaleRecent={purgeStaleRecentItems}
        initialFolderId={initialFolderId}
        onClearInitialFolderId={() => setInitialFolderId(null)}
      />
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
          onBack={() => navigate(previousRoute || 'explore')}
          onReport={() => setShowReport(true)}
          onLoad={(doc) => {
            setCurrentDoc(doc)
            addRecentItem({
              id: doc.id || selectedDocId,
              type: 'file',
              name: doc.title || 'Untitled Document',
              target: 'doc-detail',
              params: { id: doc.id || selectedDocId }
            })
          }}
        />
      )}
      {route === 'study' && (
        <StudyDocumentApi
          activeTab={studyTab} file={studyFile}
          onBack={() => navigate(previousRoute || 'library')}
          onTabChange={(tab) => { setStudyTab(tab); setStudyMode('default') }}
        />
      )}


      {showReport && <ReportModal onClose={() => setShowReport(false)} documentId={selectedDocId} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} onUserUpdate={setUser} />}
      {showFeatureRequest && <FeatureRequestModal onClose={() => setShowFeatureRequest(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showExtension && <ChromeExtensionModal onClose={() => setShowExtension(false)} />}

      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#00b830',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: 600,
          animation: 'toastSlideIn 0.2s ease forwards',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            color: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#00b830',
            fontSize: '11px',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {toast.type === 'error' ? '×' : '✓'}
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 0 0 8px',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold',
              lineHeight: 1
            }}
          >
            ×
          </button>
          <style>{`
            @keyframes toastSlideIn {
              from {
                transform: translate(-50%, -20px);
                opacity: 0;
              }
              to {
                transform: translate(-50%, 0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </AppLayout>
  )
}

const routeMatchers = [
  { pattern: ROUTES.HOME, route: 'explore' },
  { pattern: ROUTES.LOGIN, route: 'login' },
  { pattern: ROUTES.REGISTER, route: 'register' },
  { pattern: ROUTES.EXPLORE, route: 'explore' },
  { pattern: ROUTES.LIBRARY, route: 'library', libraryTab: 'sessions' },
  { pattern: ROUTES.LIBRARY_SHARED, route: 'library', libraryTab: 'shared' },
  { pattern: ROUTES.LIBRARY_FOLDERS, route: 'library', libraryTab: 'folders' },
  { pattern: ROUTES.LIBRARY_RECENT, route: 'library', libraryTab: 'recent' },
  { pattern: ROUTES.LIBRARY_FAVORITES, route: 'library', libraryTab: 'favorites' },
  { pattern: ROUTES.UPLOAD, route: 'upload', uploadMode: 'document' },
  { pattern: ROUTES.NEW_STUDY_SESSION, route: 'upload', uploadMode: 'study' },
  { pattern: ROUTES.PROFILE, route: 'profile' },
  { pattern: ROUTES.PRICING, route: 'pricing' },
  { pattern: ROUTES.FOLDER_DETAIL, route: 'folder-detail' },
  { pattern: ROUTES.DOCUMENT_DETAIL, route: 'doc-detail' },
  { pattern: ROUTES.STUDY_DOCUMENT, route: 'study' },
  { pattern: ROUTES.ADMIN_OVERVIEW, route: 'admin-overview' },
  { pattern: ROUTES.ADMIN_USERS, route: 'admin-users' },
  { pattern: ROUTES.ADMIN_DOCUMENTS, route: 'admin-documents' },
  { pattern: ROUTES.ADMIN_COURSES, route: 'admin-courses' },
  { pattern: ROUTES.ADMIN_STORAGE, route: 'admin-storage' },
  { pattern: ROUTES.ADMIN_REPORTS, route: 'admin-reports' },
  { pattern: ROUTES.ADMIN_LOGS, route: 'admin-logs' },
  { pattern: ROUTES.ADMIN_SETTINGS, route: 'admin-settings' },
]

function resolveRoute(pathname) {
  for (const item of routeMatchers) {
    const match = matchPath({ path: item.pattern, end: true }, pathname)
    if (match) return { ...item, params: match.params }
  }
  return { route: 'explore', params: {} }
}
