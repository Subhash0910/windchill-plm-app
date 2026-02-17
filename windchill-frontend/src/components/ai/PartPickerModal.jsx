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
      // Get context ID - REQUIRED by the API
      let contextId = sessionStorage.getItem('currentContextId') || localStorage.getItem('currentContextId');
      
      // Fallback: fetch from user profile
      if (!contextId) {
        try {
          console.log('Fetching user context from /api/v1/auth/me...');
          const userResponse = await api.get('/api/v1/auth/me');
          
          if (userResponse.data?.data) {
            // API returns { success: true, data: { ...userData } }
            const userData = userResponse.data.data;
            contextId = userData.currentContextId;
            
            if (contextId) {
              sessionStorage.setItem('currentContextId', contextId);
              console.log('✅ Context ID:', contextId);
            } else {
              console.warn('⚠️ User has no currentContextId');
            }
          }
        } catch (err) {
          console.error('❌ Failed to fetch user context:', err);
          throw new Error('Could not determine your workspace context. Please select a context first.');
        }
      }

      // Context ID is required - fail if not available
      if (!contextId) {
        throw new Error('No workspace context selected. Please go to Parts page and select a Product/Project first.');
      }

      // Use correct endpoint: /api/v1/plm/parts with required contextId
      const url = `/api/v1/plm/parts?contextId=${contextId}`;
      
      console.log('Loading parts from:', url);
      
      // Fetch parts using axios API wrapper (handles auth automatically)
      const response = await api.get(url);
      
      console.log('✅ Parts API response:', response.status);
      
      // API returns { success: true, data: [...parts] }
      const partsList = response.data?.data;
      
      if (!Array.isArray(partsList)) {
        console.error('❌ Unexpected response format:', response.data);
        setError('Invalid response from server');
        setParts([]);
      } else {
        console.log(`✅ Loaded ${partsList.length} parts`);
        setParts(partsList);
        
        if (partsList.length === 0) {
          setError('No parts found in this context. Create some parts first in the Parts workspace.');
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load parts:', error);
      
      // Better error messages
      if (error.response?.status === 403) {
        setError('Access denied. Please ensure you have selected a valid Product/Project context.');
      } else if (error.response?.status === 401) {
        setError('Session expired. Please logout and login again.');
      } else if (error.response?.status === 400) {
        setError('Invalid request. Context ID is required.');
      } else if (!error.response) {
        setError('Cannot connect to backend. Is the server running?');
      } else {
        setError(error.message || 'Failed to load parts. Please try again.');
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
      console.log('✅ Selected part:', selectedPart);
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
              <small>{searchTerm ? 'Try a different search term' : 'Create parts in the Parts workspace first'}</small>
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