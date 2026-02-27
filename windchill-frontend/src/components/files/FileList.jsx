import React, { useState, useEffect } from 'react';
import { Download, Trash2, File, Image, FileText, Calendar, User } from 'lucide-react';
import axios from 'axios';

/**
 * File List Component
 * Displays files attached to an entity
 * 
 * @param {Object} props
 * @param {string} props.entityType - Entity type
 * @param {number} props.entityId - Entity ID
 * @param {string} props.category - Optional category filter
 * @param {boolean} props.refreshTrigger - Trigger to refresh list
 */
const FileList = ({ entityType, entityId, category, refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch files
  useEffect(() => {
    fetchFiles();
  }, [entityType, entityId, category, refreshTrigger]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = category
        ? `/api/v1/files/entity/${entityType}/${entityId}?category=${category}`
        : `/api/v1/files/entity/${entityType}/${entityId}`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setFiles(response.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  // Download file
  const handleDownload = async (file) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `/api/v1/files/${file.id}/download`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log(`✅ Downloaded: ${file.originalFilename}`);
    } catch (err) {
      console.error('❌ Download failed:', err);
      alert('Failed to download file');
    }
  };

  // Delete file
  const handleDelete = async (file) => {
    if (!window.confirm(`Delete ${file.originalFilename}?`)) return;

    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`/api/v1/files/${file.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log(`🗑️ Deleted: ${file.originalFilename}`);
      fetchFiles(); // Refresh list
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Failed to delete file');
    }
  };

  // Get file icon
  const getFileIcon = (file) => {
    if (file.contentType.startsWith('image/')) {
      return <Image className="w-12 h-12 text-blue-500" />;
    }
    if (file.contentType === 'application/pdf') {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    return <File className="w-12 h-12 text-gray-500" />;
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <File className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">No files uploaded yet</p>
        <p className="text-sm">Files will appear here once uploaded</p>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Attached Files ({files.length})
        </h3>
        <button
          onClick={fetchFiles}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* File Icon/Preview */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-shrink-0">
                {getFileIcon(file)}
              </div>
              <div className="flex gap-2">
                {/* Download Button */}
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(file)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* File Info */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 truncate" title={file.originalFilename}>
                {file.originalFilename}
              </h4>
              
              {file.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {file.description}
                </p>
              )}

              <div className="flex items-center text-xs text-gray-500 space-x-4">
                <span>{formatFileSize(file.fileSize)}</span>
                {file.category && (
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {file.category}
                  </span>
                )}
              </div>

              {/* Upload Info */}
              <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
                <div className="flex items-center text-xs text-gray-500">
                  <User className="w-3 h-3 mr-1" />
                  <span>by {file.uploadedBy?.username || 'Unknown'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{formatDate(file.uploadedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
