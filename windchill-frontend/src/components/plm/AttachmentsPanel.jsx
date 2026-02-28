import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import './AttachmentsPanel.css';

const FILE_ICONS = {
  'application/pdf':    '📄',
  'image/':             '🖼️',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': '📊',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml': '📝',
  'application/zip':    '🗂️',
  'application/x-zip': '🗂️',
  'text/':              '📋',
};

const getIcon = (contentType) => {
  if (!contentType) return '📎';
  for (const [key, icon] of Object.entries(FILE_ICONS)) {
    if (contentType.startsWith(key)) return icon;
  }
  return '📎';
};

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1_048_576)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

const AttachmentsPanel = ({ entityType, entityId }) => {
  const [files,     setFiles]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [deleteId,  setDeleteId]  = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/v1/files/entity/${entityType}/${entityId}`);
      setFiles(res.data || []);
    } catch {
      setError('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  /* ─ Upload ─ */
  const handleUpload = async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file',       fileList[0]);
    formData.append('entityType', entityType);
    formData.append('entityId',   String(entityId));
    try {
      await api.post('/api/v1/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /* ─ Download (auth-safe via fetch + blob) ─ */
  const handleDownload = (fileId, filename) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const base  = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${base}/api/v1/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.blob())
      .then(blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.setAttribute('download', filename || 'file');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(() => setError('Download failed'));
  };

  /* ─ Delete ─ */
  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this attachment?')) return;
    try {
      setDeleteId(fileId);
      await api.delete(`/api/v1/files/${fileId}`);
      setFiles(f => f.filter(x => x.id !== fileId));
    } catch {
      setError('Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="att-panel">

      {/* Drop zone */}
      <div
        className={`att-dropzone${dragOver ? ' att-dropzone--over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
        />
        {uploading ? (
          <div className="att-uploading">
            <span className="att-spinner" />
            <span>Uploading…</span>
          </div>
        ) : (
          <>
            <span className="att-drop-icon">📎</span>
            <span className="att-drop-text">
              <strong>Click to upload</strong> or drag &amp; drop
            </span>
            <span className="att-drop-hint">Any file type · Max 50 MB</span>
          </>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="att-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="att-skeletons">
          {[1,2,3].map(i => <div key={i} className="att-skeleton" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="att-empty">
          <span>📭</span>
          <p>No attachments yet</p>
          <span className="att-empty-hint">
            Upload files above to attach them to this {entityType.toLowerCase()}
          </span>
        </div>
      ) : (
        <div className="att-list">
          <div className="att-list-header">
            <span>{files.length} file{files.length !== 1 ? 's' : ''} attached</span>
            <button className="att-refresh" onClick={load}>↺ Refresh</button>
          </div>
          {files.map(f => (
            <div key={f.id} className="att-row">
              <span className="att-file-icon">{getIcon(f.contentType)}</span>
              <div className="att-file-info">
                <span className="att-filename">{f.originalFilename || f.fileName || 'Unknown file'}</span>
                <span className="att-meta">
                  {formatSize(f.fileSize)}
                  {f.uploadedBy   ? ` · ${f.uploadedBy}`                       : ''}
                  {f.uploadedAt   ? ` · ${new Date(f.uploadedAt).toLocaleDateString()}` : ''}
                  {f.category     ? ` · ${f.category}`                         : ''}
                </span>
              </div>
              <div className="att-actions">
                <button
                  className="att-btn att-btn--download"
                  onClick={() => handleDownload(f.id, f.originalFilename)}
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  className="att-btn att-btn--delete"
                  onClick={() => handleDelete(f.id)}
                  disabled={deleteId === f.id}
                  title="Delete"
                >
                  {deleteId === f.id ? '…' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentsPanel;
