import { useEffect, useRef, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { InfoLine } from '../study-hub/shared'
import { getDocCourseCode } from './Explore'
import { getDocument, downloadDocumentFile } from '../../features/documents/documentService'
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
import { featuredDocuments } from '../../data/studyHubData'

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
  const [prevId, setPrevId] = useState(id)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  if (id !== prevId) {
    setPrevId(id)
    setLoading(true)
    setError('')
  }

  const [prevFavCheckKey, setPrevFavCheckKey] = useState(() => `${guest}_${user?.id || ''}`)

  if (`${guest}_${user?.id || ''}` !== prevFavCheckKey) {
    setPrevFavCheckKey(`${guest}_${user?.id || ''}`)
    if (guest || !user?.id) {
      setIsFavorite(false)
    }
  }

  useEffect(() => {
    if (!id) return

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
