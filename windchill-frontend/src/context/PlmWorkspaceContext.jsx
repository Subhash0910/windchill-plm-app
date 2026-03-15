import React, { createContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
  CONTEXT_ID: 'plm_selected_context_id',
  FOLDER_ID: 'plm_selected_folder_id',
  FOLDER_PATH: 'plm_selected_folder_path',
};

// Default to context ID 1 (Automotive ECU Platform — seeded by V105)
const DEFAULT_CONTEXT_ID = 1;

export const PlmWorkspaceContext = createContext(null);

export const PlmWorkspaceProvider = ({ children }) => {
  const [selectedContextId, setSelectedContextId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState('/');

  useEffect(() => {
    const ctxId = localStorage.getItem(STORAGE_KEYS.CONTEXT_ID);
    const folderId = localStorage.getItem(STORAGE_KEYS.FOLDER_ID);
    const folderPath = localStorage.getItem(STORAGE_KEYS.FOLDER_PATH);

    // If no context saved in localStorage yet, fall back to the default seeded context
    setSelectedContextId(ctxId ? Number(ctxId) : DEFAULT_CONTEXT_ID);
    if (folderId) setSelectedFolderId(Number(folderId));
    if (folderPath) setSelectedFolderPath(folderPath);
  }, []);

  useEffect(() => {
    if (selectedContextId == null) {
      localStorage.removeItem(STORAGE_KEYS.CONTEXT_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.CONTEXT_ID, String(selectedContextId));
    }
  }, [selectedContextId]);

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
    setSelectedContextId: (id) => {
      setSelectedContextId(id);
      // Reset folder selection on context switch
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
  }), [selectedContextId, selectedFolderId, selectedFolderPath]);

  return (
    <PlmWorkspaceContext.Provider value={value}>
      {children}
    </PlmWorkspaceContext.Provider>
  );
};
