package com.windchill.service.plm;

import com.windchill.domain.entity.Folder;

import java.util.List;

public interface IFolderService {
    Folder ensureRootFolder(Long contextId);
    Folder createFolder(Long contextId, Long parentId, String name);
    List<Folder> listFolders(Long contextId);
    
    void deleteFolder(Long contextId, Long folderId);
}
