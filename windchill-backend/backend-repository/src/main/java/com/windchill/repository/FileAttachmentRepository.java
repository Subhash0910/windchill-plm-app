package com.windchill.repository;

import com.windchill.domain.entity.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {
    List<FileAttachment> findByEntityTypeAndEntityIdOrderByUploadedAtDesc(String entityType, Long entityId);
    void deleteByEntityTypeAndEntityId(String entityType, Long entityId);
}
