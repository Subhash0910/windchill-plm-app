package com.windchill.service.file;

import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.FileAttachment;
import com.windchill.repository.FileAttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileAttachmentServiceImpl implements IFileAttachmentService {

    private final FileAttachmentRepository repo;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private static final long MAX_BYTES = 50L * 1024 * 1024; // 50 MB

    @Override
    @Transactional
    public FileAttachment store(MultipartFile file, String entityType, Long entityId,
                                String uploadedBy, String category) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("File exceeds 50 MB limit");

        String original  = sanitizeFilename(file.getOriginalFilename());
        String ext       = extension(original);
        String stored    = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
        Path   dir       = Paths.get(uploadDir, entityType.toLowerCase());
        Files.createDirectories(dir);
        Path   target    = dir.resolve(stored);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        FileAttachment fa = new FileAttachment();
        fa.setEntityType(entityType.toUpperCase());
        fa.setEntityId(entityId);
        fa.setOriginalFilename(original);
        fa.setStoredFilename(stored);
        fa.setStoragePath(target.toAbsolutePath().toString());
        fa.setContentType(file.getContentType());
        fa.setFileSize(file.getSize());
        fa.setCategory(category);
        fa.setUploadedBy(uploadedBy);
        FileAttachment saved = repo.save(fa);
        log.info("Stored attachment {} for {}/{} by {}", stored, entityType, entityId, uploadedBy);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FileAttachment> listByEntity(String entityType, Long entityId) {
        return repo.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType.toUpperCase(), entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public FileAttachment getById(Long id) {
        return repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("FileAttachment not found: " + id));
    }

    @Override
    public Path resolveStoragePath(FileAttachment attachment) {
        return Paths.get(attachment.getStoragePath());
    }

    @Override
    @Transactional
    public void delete(Long id, String requestedBy) {
        FileAttachment fa = getById(id);
        try {
            Files.deleteIfExists(Paths.get(fa.getStoragePath()));
        } catch (IOException e) {
            log.warn("Could not delete file from disk: {} — {}", fa.getStoragePath(), e.getMessage());
        }
        repo.deleteById(id);
        log.info("Deleted attachment {} by {}", id, requestedBy);
    }

    private static String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) return "upload";
        return Paths.get(name).getFileName().toString()
                   .replaceAll("[^a-zA-Z0-9._\\- ]", "_");
    }

    private static String extension(String filename) {
        int dot = filename.lastIndexOf('.');
        return (dot >= 0 && dot < filename.length() - 1) ? filename.substring(dot + 1) : "";
    }
}
