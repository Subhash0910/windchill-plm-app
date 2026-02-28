package com.windchill.repository;

import com.windchill.domain.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByContextIdAndIsDeletedFalseOrderByPathAsc(Long contextId);
    Optional<Folder> findByContextIdAndPathAndIsDeletedFalse(Long contextId, String path);
    List<Folder> findByContextIdAndParentIdAndIsDeletedFalseOrderByNameAsc(Long contextId, Long parentId);
    
    List<Folder> findByParentIdAndIsDeletedFalse(Long parentId);
}
