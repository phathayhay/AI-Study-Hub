import { useEffect, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { SectionTitle } from '../study-hub/shared'
import { DocumentCard, getDocCourseCode } from './Explore'
import { getUserFavorites as getFavoriteDocuments } from '../../services/communityService'
import { getFolder, getPublicFolder, updateFolderVisibility } from '../../features/folders/folderService'
import { getToken } from '../../services/api'

function getFolderCode(folderName = '') {
  const codeMatch = folderName.match(/^([A-Z]{3}\d{3})/i)
  return codeMatch ? codeMatch[1].toUpperCase() : 'FPTU'
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
                key={`${doc.id}_${favoriteIds.has(doc.id)}`}
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
