package com.windchill.plm.service;

import com.windchill.plm.model.FileMetadata;
import com.windchill.plm.model.User;
import com.windchill.plm.repository.FileMetadataRepository;
import com.windchill.plm.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service for file upload and management.
 * 
 * @author Subhash
 * @version 2.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    @Qualifier("localStorageService")
    private final FileStorageService storageService;
    
    private final FileMetadataRepository fileMetadataRepository;

    @Value("${app.file-storage.max-size:52428800}") // 50MB default
    private long maxFileSize;

    @Value("${app.file-storage.allowed-types:image/jpeg,image/png,image/svg+xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet}")
    private String allowedTypes;

    /**
     * Upload a file
     * 
     * @param file File to upload
     * @param entityType Entity type (ECN, PART, etc.)
     * @param entityId Entity ID
     * @param user User uploading the file
     * @param description Optional file description
     * @param category Optional category
     * @return File metadata
     */
    @Transactional
    public FileMetadata uploadFile(
            MultipartFile file,
            String entityType,
            Long entityId,
            User user,
            String description,
            String category) throws IOException {
        
        log.info("📤 Uploading file: {} for {}/{} by user {}", 
                file.getOriginalFilename(), entityType, entityId, user.getId());
        
        // Validate file
        validateFile(file);
        
        // Generate unique filename
        String uniqueFilename = generateUniqueFilename(file.getOriginalFilename());
        
        // Build storage path: {entityType}/{entityId}/{filename}
        String storagePath = String.format("%s/%d/%s", 
                entityType.toLowerCase(), entityId, uniqueFilename);
        
        // Store file
        String actualPath = storageService.store(file, storagePath);
        
        // Calculate checksum
        String checksum = calculateChecksum(file);
        
        // Create metadata
        FileMetadata metadata = FileMetadata.builder()
                .filename(uniqueFilename)
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(actualPath)
                .storageType(storageService.getStorageType())
                .entityType(entityType)
                .entityId(entityId)
                .uploadedBy(user)
                .uploadedAt(Instant.now())
                .checksum(checksum)
                .description(description)
                .category(category)
                .isDeleted(false)
                .build();
        
        metadata = fileMetadataRepository.save(metadata);
        
        log.info("✅ File uploaded successfully: id={}, size={}", 
                metadata.getId(), metadata.getHumanReadableSize());
        
        return metadata;
    }

    /**
     * Simplified upload without description/category
     */
    @Transactional
    public FileMetadata uploadFile(
            MultipartFile file,
            String entityType,
            Long entityId,
            User user) throws IOException {
        return uploadFile(file, entityType, entityId, user, null, null);
    }

    /**
     * Get file metadata by ID
     */
    @Transactional(readOnly = true)
    public FileMetadata getFileMetadata(Long fileId) {
        return fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
    }

    /**
     * Download file
     */
    public InputStream downloadFile(Long fileId) throws IOException {
        FileMetadata metadata = getFileMetadata(fileId);
        
        if (metadata.getIsDeleted()) {
            throw new IOException("File has been deleted");
        }
        
        log.info("📥 Downloading file: id={}, filename={}", fileId, metadata.getOriginalFilename());
        
        return storageService.load(metadata.getStoragePath());
    }

    /**
     * Get all files for an entity
     */
    @Transactional(readOnly = true)
    public List<FileMetadata> getEntityFiles(String entityType, Long entityId) {
        return fileMetadataRepository.findByEntityTypeAndEntityIdAndIsDeletedFalse(
                entityType, entityId);
    }

    /**
     * Get files by category
     */
    @Transactional(readOnly = true)
    public List<FileMetadata> getEntityFilesByCategory(
            String entityType, Long entityId, String category) {
        return fileMetadataRepository.findByEntityTypeAndEntityIdAndCategoryAndIsDeletedFalse(
                entityType, entityId, category);
    }

    /**
     * Delete file (soft delete)
     */
    @Transactional
    public void deleteFile(Long fileId) {
        FileMetadata metadata = getFileMetadata(fileId);
        metadata.softDelete();
        fileMetadataRepository.save(metadata);
        
        log.info("🗑️ File soft deleted: id={}", fileId);
    }

    /**
     * Permanently delete file (removes from storage)
     */
    @Transactional
    public void permanentlyDeleteFile(Long fileId) throws IOException {
        FileMetadata metadata = getFileMetadata(fileId);
        
        // Delete from storage
        storageService.delete(metadata.getStoragePath());
        
        // Delete metadata
        fileMetadataRepository.delete(metadata);
        
        log.info("❌ File permanently deleted: id={}", fileId);
    }

    /**
     * Validate file before upload
     */
    private void validateFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("Cannot upload empty file");
        }
        
        // Check file size
        if (file.getSize() > maxFileSize) {
            throw new IOException(String.format(
                    "File size exceeds maximum allowed size of %d MB",
                    maxFileSize / (1024 * 1024)));
        }
        
        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedContentType(contentType)) {
            throw new IOException("File type not allowed: " + contentType);
        }
        
        // Check filename
        String filename = file.getOriginalFilename();
        if (filename == null || filename.contains("..")) {
            throw new IOException("Invalid filename");
        }
    }

    /**
     * Check if content type is allowed
     */
    private boolean isAllowedContentType(String contentType) {
        List<String> allowed = Arrays.asList(allowedTypes.split(","));
        return allowed.stream().anyMatch(contentType::startsWith);
    }

    /**
     * Generate unique filename
     */
    private String generateUniqueFilename(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }

    /**
     * Calculate SHA-256 checksum
     */
    private String calculateChecksum(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.warn("⚠️ Could not calculate checksum: {}", e.getMessage());
            return null;
        }
    }
}
