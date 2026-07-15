import StudyHubIcon from '../../../components/icons/StudyHubIcons'

export default function OriginalDocument({ file }) {
  const documentName = file?.name || file?.attachmentName || 'Untitled document'
  const fileUrl = file?.fileUrl || ''

  const isPdf = fileUrl.toLowerCase().endsWith('.pdf')
  const isLocal = fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1')

  if (!fileUrl) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748b' }}>
        Không có URL file từ backend để xem trước.
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="document-preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
        <iframe
          src={fileUrl}
          width="100%"
          height="100%"
          title="Document Preview"
          style={{ flex: 1, backgroundColor: '#f1f5f9', border: 'none' }}
        />
      </div>
    )
  }

  if (isLocal) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#475569', gap: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="m21 16-4-4-4 4" />
            <path d="m14 14-3-3-4 3" />
            <circle cx="9" cy="9" r="2" />
          </svg>
        </div>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Không thể xem trước tệp Word/PowerPoint trên localhost</h4>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', lineHeight: 1.5, margin: 0 }}>
            Google Docs Viewer không thể kết nối tới máy chủ <strong>localhost</strong> trong môi trường phát triển local của bạn để lấy nội dung file.
          </p>
        </div>
        <a
          href={fileUrl}
          download={documentName}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#6366f1',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.15)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Tải tài liệu về máy
        </a>
      </div>
    )
  }

  return (
    <div className="document-preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
        width="100%"
        height="100%"
        title="Document Preview"
        style={{ flex: 1, backgroundColor: '#f1f5f9', border: 'none' }}
      />
    </div>
  )
}
