import { useState, useRef } from 'react'
import { patientApi } from '../api/patientApi'
import { X, Loader2, AlertCircle, UploadCloud, File, CheckCircle2 } from 'lucide-react'

const DOCUMENT_TYPES = [
  { value: 'LAB_REPORT', label: 'Laboratory Report' },
  { value: 'SCAN', label: 'Radiology / Scan (X-Ray, MRI, CT)' },
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'DISCHARGE_SUMMARY', label: 'Discharge Summary' },
  { value: 'ID_PROOF', label: 'ID / Insurance Document' },
  { value: 'OTHER', label: 'Other Document' }
]

export default function DocumentUploadModal({
  isOpen,
  onClose,
  patientId,
  onDocumentUploaded
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [documentName, setDocumentName] = useState('')
  const [documentType, setDocumentType] = useState('LAB_REPORT')
  const [notes, setNotes] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleFileChange = (file) => {
    if (!file) return
    setSelectedFile(file)
    if (!documentName.trim()) {
      // Auto-populate document name with sanitized file name (without extension)
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      setDocumentName(baseName.replace(/[_-]/g, ' '))
    }
    setError('')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedFile) {
      setError('Please select a file to upload.')
      return
    }
    if (!documentName.trim()) {
      setError('Document name is required.')
      return
    }

    setLoading(true)

    try {
      const uploaded = await patientApi.uploadDocument(patientId, {
        file: selectedFile,
        documentName: documentName.trim(),
        documentType,
        notes: notes.trim() || null
      })

      onDocumentUploaded(uploaded)
      handleClose()
    } catch (err) {
      const respData = err.response?.data
      setError(respData?.message || err.message || 'Failed to upload document.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setDocumentName('')
    setDocumentType('LAB_REPORT')
    setNotes('')
    setError('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)'
            }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Upload Patient Document</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Attach lab reports, imaging scans, prescriptions, or discharge records.
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={handleClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Dropzone */}
            <div
              className={`file-dropzone ${isDragging ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: '1.25rem' }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              />
              {selectedFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <div style={{ color: 'var(--primary)' }}>
                    <File size={32} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatFileSize(selectedFile.size)} • Click to replace file
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                    <UploadCloud size={40} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    Click to browse or drag and drop files here
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PDF, JPG, PNG, DOCX, DICOM up to 25MB
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Document Title / Display Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Complete Blood Count (CBC) Report"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Document Category / Type *</label>
              <select
                className="form-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Description (Optional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Clinical observations, reference ranges, or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedFile}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
