package com.windchill.service.file;

import com.windchill.domain.entity.FileAttachment;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public interface IFileAttachmentService {
    FileAttachment store(MultipartFile file, String entityType, Long entityId, String uploadedBy, String category) throws IOException;
    List<FileAttachment> listByEntity(String entityType, Long entityId);
    FileAttachment getById(Long id);
    Path resolveStoragePath(FileAttachment attachment);
    void delete(Long id, String requestedBy);
}
