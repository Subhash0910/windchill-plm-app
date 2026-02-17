import { useState, useEffect } from 'react';
import api from '../../utils/api';
import './PartPickerModal.css';

/**
 * Part Picker Modal - Search and select parts from database
 */
const PartPickerModal = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadParts();
    }
  }, [isOpen]);

  const loadParts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the ACTUAL current context - don't use fallback!
      const contextId = sessionStorage.getItem('currentContextId') || localStorage.getItem('currentContextId');
      
      if (!contextId) {
        setError('No context selected. Please go to Parts page and select a Product/Project first.');
        setLoading(false);
        return;
      }
      
      console.log('Using context ID:', contextId);
      
      // Call the parts API with the current context
      const response = await api.get(`/api/v1/plm/parts?contextId=${contextId}`);
      
      console.log('Parts response:', response.data);
      
      const partsList = response.data?.data || [];
      
      console.log(`Loaded ${partsList.length} parts from context ${contextId}`);
      setParts(partsList);
      
      if (partsList.length === 0) {
        setError(`No parts found in this context. Create some parts in the Parts workspace for context ${contextId}.`);
      }
      
    } catch (error) {
      console.error('Error loading parts:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        setError('Session expired. Please logout and login again.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to load parts');
      }
      
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = parts.filter(part => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      part.partNumber?.toLowerCase().includes(search) ||
      part.name?.toLowerCase().includes(search) ||
      part.id?.toString().includes(search)
    );
  });

  const handleSelect = () => {
    if (selectedPart) {
      console.log('Selected part:', selectedPart);
      onSelect(selectedPart);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="part-picker-overlay" onClick={onClose}>
      <div className="part-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="part-picker-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Select Part
          </h2>
          <button onClick={onClose} className="close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="part-picker-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by part number, name, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="part-picker-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading parts...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e53e3e">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>{error}</p>
              <button onClick={loadParts} className="btn-retry">Retry</button>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0">
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>No parts found</p>
              <small>{searchTerm ? 'Try a different search term' : 'No parts in current context'}</small>
            </div>
          ) : (
            filteredParts.map((part) => (
              <div
                key={part.id}
                className={`part-item ${selectedPart?.id === part.id ? 'selected' : ''}`}
                onClick={() => setSelectedPart(part)}
              >
                <div className="part-item-main">
                  <div className="part-number">{part.partNumber}</div>
                  <div className="part-name">{part.name}</div>
                </div>
                <div className="part-item-meta">
                  <span className={`part-state part-state--${part.lifecycleState?.toLowerCase()}`}>
                    {part.lifecycleState}
                  </span>
                  <span className="part-version">
                    {part.revision}.{part.iteration}
                  </span>
                  <span className="part-id">ID: {part.id}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="part-picker-footer">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button 
            onClick={handleSelect} 
            className="btn-select"
            disabled={!selectedPart}
          >
            Select Part
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartPickerModal;