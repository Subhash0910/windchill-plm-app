package com.windchill.service.plm;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.Folder;
import com.windchill.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FolderServiceImpl implements IFolderService {

    private final FolderRepository folderRepository;
    private final IAuditService auditService;

    @Override
    public Folder ensureRootFolder(Long contextId) {
        return folderRepository.findByContextIdAndPathAndIsDeletedFalse(contextId, "/")
                .orElseGet(() -> {
                    Folder root = new Folder();
                    root.setContextId(contextId);
                    root.setParentId(null);
                    root.setName("Root");
                    root.setPath("/");
                    Folder saved = folderRepository.save(root);
                    auditService.log(PlmEntityTypeEnum.FOLDER, saved.getId(), "CREATE_ROOT", "Root folder created");
                    return saved;
                });
    }

    @Override
    public Folder createFolder(Long contextId, Long parentId, String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("Folder name is required");
        }

        Folder parent = (parentId == null)
                ? ensureRootFolder(contextId)
                : folderRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", parentId));

        if (!parent.getContextId().equals(contextId)) {
            throw new BusinessException("Parent folder does not belong to this context");
        }

        String clean = name.trim().replaceAll("/+", "-");
        String parentPath = parent.getPath();
        String path = "/".equals(parentPath) ? ("/" + clean) : (parentPath + "/" + clean);

        folderRepository.findByContextIdAndPathAndIsDeletedFalse(contextId, path)
                .ifPresent(f -> { throw new BusinessException("Folder already exists: " + path); });

        Folder folder = new Folder();
        folder.setContextId(contextId);
        folder.setParentId(parent.getId());
        folder.setName(clean);
        folder.setPath(path);

        Folder saved = folderRepository.save(folder);
        auditService.log(PlmEntityTypeEnum.FOLDER, saved.getId(), "CREATE", "Folder created: " + path);
        log.info("Folder created: {}", path);
        return saved;
    }

    @Override
    public List<Folder> listFolders(Long contextId) {
        // NOTE: do not mark this method readOnly, because we may lazily bootstrap the Root folder.
        ensureRootFolder(contextId);
        return folderRepository.findByContextIdAndIsDeletedFalseOrderByPathAsc(contextId);
    }
}
