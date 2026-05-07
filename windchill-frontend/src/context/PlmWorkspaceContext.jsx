import React, { createContext, useEffect, useMemo, useState } from 'react';
import { plmApi } from '../services/plmApi';

const STORAGE_KEYS = {
  CONTEXT_ID:   'plm_selected_context_id',
  CONTEXT_NAME: 'plm_selected_context_name',
  FOLDER_ID:    'plm_selected_folder_id',
  FOLDER_PATH:  'plm_selected_folder_path',
};

export const PlmWorkspaceContext = createContext(null);

export const PlmWorkspaceProvider = ({ children }) => {
  const [selectedContextId,   setSelectedContextId]   = useState(null);
  const [selectedContextName, setSelectedContextName] = useState('');
  const [selectedFolderId,    setSelectedFolderId]    = useState(null);
  const [selectedFolderPath,  setSelectedFolderPath]  = useState('/');

  useEffect(() => {
    const ctxId    = localStorage.getItem(STORAGE_KEYS.CONTEXT_ID);
    const ctxName  = localStorage.getItem(STORAGE_KEYS.CONTEXT_NAME);
    const folderId = localStorage.getItem(STORAGE_KEYS.FOLDER_ID);
    const folderPath = localStorage.getItem(STORAGE_KEYS.FOLDER_PATH);

    if (ctxId) {
      setSelectedContextId(Number(ctxId));
      if (ctxName) setSelectedContextName(ctxName);
    } else {
      // No stored context — auto-select the first available one
      plmApi.listContexts().then(contexts => {
        const active = Array.isArray(contexts) ? contexts.find(c => c.isActive !== false) : null;
        if (active) {
          setSelectedContextId(active.id);
          setSelectedContextName(active.name || active.code || '');
        }
      }).catch(() => {/* backend sleeping — user must select manually */});
    }

    if (folderId)   setSelectedFolderId(Number(folderId));
    if (folderPath) setSelectedFolderPath(folderPath);
  }, []);

  useEffect(() => {
    if (selectedContextId == null) {
      localStorage.removeItem(STORAGE_KEYS.CONTEXT_ID);
      localStorage.removeItem(STORAGE_KEYS.CONTEXT_NAME);
    } else {
      localStorage.setItem(STORAGE_KEYS.CONTEXT_ID, String(selectedContextId));
      if (selectedContextName) localStorage.setItem(STORAGE_KEYS.CONTEXT_NAME, selectedContextName);
    }
  }, [selectedContextId, selectedContextName]);

  useEffect(() => {
    if (selectedFolderId == null) {
      localStorage.removeItem(STORAGE_KEYS.FOLDER_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.FOLDER_ID, String(selectedFolderId));
    }
  }, [selectedFolderId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOLDER_PATH, selectedFolderPath || '/');
  }, [selectedFolderPath]);

  const value = useMemo(() => ({
    selectedContextId,
    selectedContextName,
    setSelectedContextId: (id, name) => {
      setSelectedContextId(id);
      if (name !== undefined) setSelectedContextName(name || '');
      setSelectedFolderId(null);
      setSelectedFolderPath('/');
    },
    selectedFolderId,
    selectedFolderPath,
    setSelectedFolder: (folder) => {
      if (!folder) {
        setSelectedFolderId(null);
        setSelectedFolderPath('/');
        return;
      }
      setSelectedFolderId(folder.id);
      setSelectedFolderPath(folder.path || '/');
    },
  }), [selectedContextId, selectedContextName, selectedFolderId, selectedFolderPath]);

  return (
    <PlmWorkspaceContext.Provider value={value}>
      {children}
    </PlmWorkspaceContext.Provider>
  );
};
