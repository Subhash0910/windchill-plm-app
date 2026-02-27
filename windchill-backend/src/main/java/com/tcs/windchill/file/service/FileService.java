package com.tcs.windchill.file.service;

import com.tcs.windchill.exception.ResourceNotFoundException;
import com.tcs.windchill.file.model.FileMetadata;
import com.tcs.windchill.file.model.ScanStatus;
import com.tcs.windchill.file.model.StorageType;
import com.tcs.windchill.file.repository.FileMetadataRepository;
import com.tcs.windchill.user.model.User;
import com.tcs.windchill.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * File management service
 * 
 * Handles:
 * - File upload with validation
 * - File download with access control
 * - File deletion (soft delete)
 * - Storage management
 * 
 * @author Subhash
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final UserRepository userRepository;
    private final FileStorageService storageService;

    @Value("${file.max-size:52428800}") // 50MB default
    private long maxFileSize;

    @Value("${file.allowed-extensions:pdf,docx,xlsx,jpg,jpeg,png,svg,dwg,step,iges,zip}")
    private String allowedExtensions;

    /**
     * Upload file
     */
    @Transactional
    public FileMetadata uploadFile(
            MultipartFile file,
            String entityType,
            Long entityId,
            Long userId,
            String description
    ) throws IOException {
        
        // 1. Validate file
        validateFile(file);

        // 2. Get user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // 3. Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String uniqueFilename = generateUniqueFilename(entityType, entityId, extension);

        // 4. Calculate checksum
        String checksum = calculateChecksum(file.getInputStream());

        // 5. Check for duplicates (optional: save storage)
        FileMetadata existing = checkDuplicate(checksum, entityType, entityId);
        if (existing != null) {
            log.info("♻️ Duplicate file detected, reusing existing: {}", existing.getId());
            return existing;
        }

        // 6. Store file
        String storagePath = storageService.store(uniqueFilename, file);

        // 7. Create metadata
        FileMetadata metadata = FileMetadata.builder()
            .filename(uniqueFilename)
            .originalFilename(originalFilename)
            .contentType(file.getContentType())
            .fileSize(file.getSize())
            .storagePath(storagePath)
            .storageType(getStorageType())
            .entityType(entityType)
            .entityId(entityId)
            .uploadedBy(user)
            .checksum(checksum)
            .scanStatus(ScanStatus.PENDING) // Will be scanned by background job
            .description(description)
            .build();

        metadata = fileMetadataRepository.save(metadata);
        log.info("✅ File uploaded: {} for {}/{}", metadata.getId(), entityType, entityId);

        return metadata;
    }

    /**
     * Download file
     */
    @Transactional(readOnly = true)
    public Resource downloadFile(Long fileId, Long userId) throws IOException {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        // Security: Verify user has access to this file
        verifyAccess(metadata, userId);

        // Check if file is infected
        if (metadata.getScanStatus() == ScanStatus.INFECTED) {
            throw new SecurityException("File is infected with virus and cannot be downloaded");
        }

        InputStream inputStream = storageService.getFile(metadata.getStoragePath());
        return new InputStreamResource(inputStream);
    }

    /**
     * Get file metadata
     */
    @Transactional(readOnly = true)
    public FileMetadata getFileMetadata(Long fileId, Long userId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        verifyAccess(metadata, userId);
        return metadata;
    }

    /**
     * Get files for entity
     */
    @Transactional(readOnly = true)
    public List<FileMetadata> getEntityFiles(String entityType, Long entityId) {
        return fileMetadataRepository
            .findByEntityTypeAndEntityIdAndIsDeletedFalseOrderByUploadedAtDesc(entityType, entityId);
    }

    /**
     * Delete file (soft delete)
     */
    @Transactional
    public void deleteFile(Long fileId, Long userId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        // Security: Only uploader or admin can delete
        if (!metadata.getUploadedBy().getId().equals(userId)) {
            // TODO: Check if user has admin role
            throw new SecurityException("Not authorized to delete this file");
        }

        metadata.markDeleted();
        fileMetadataRepository.save(metadata);
        log.info("🗑️ File {} marked as deleted by user {}", fileId, userId);
    }

    /**
     * Get signed URL for secure download (S3 only)
     */
    public String getSignedUrl(Long fileId, Long userId, int expiryMinutes) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        verifyAccess(metadata, userId);

        if (metadata.getScanStatus() == ScanStatus.INFECTED) {
            throw new SecurityException("File is infected");
        }

        return storageService.generateSignedUrl(metadata.getStoragePath(), expiryMinutes);
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Validate uploaded file
     */
    private void validateFile(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Check file size
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                String.format("File size exceeds maximum: %d MB", maxFileSize / (1024 * 1024))
            );
        }

        // Check file extension
        String filename = file.getOriginalFilename();
        if (filename == null || !isAllowedExtension(filename)) {
            throw new IllegalArgumentException(
                "File type not allowed. Allowed: " + allowedExtensions
            );
        }

        // Check for dangerous filenames (path traversal)
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new SecurityException("Invalid filename detected");
        }
    }

    /**
     * Check if file extension is allowed
     */
    private boolean isAllowedExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        List<String> allowed = Arrays.asList(allowedExtensions.toLowerCase().split(","));
        return allowed.contains(extension);
    }

    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1) : "";
    }

    /**
     * Generate unique filename
     */
    private String generateUniqueFilename(String entityType, Long entityId, String extension) {
        String uuid = UUID.randomUUID().toString();
        return String.format("%s/%d/%s.%s", 
            entityType.toLowerCase(), 
            entityId, 
            uuid, 
            extension
        );
    }

    /**
     * Calculate SHA-256 checksum
     */
    private String calculateChecksum(InputStream inputStream) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int bytesRead;
            
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available", e);
            return null;
        }
    }

    /**
     * Check for duplicate file
     */
    private FileMetadata checkDuplicate(String checksum, String entityType, Long entityId) {
        if (checksum == null) return null;
        
        List<FileMetadata> duplicates = fileMetadataRepository.findDuplicatesByChecksum(checksum);
        
        // Check if duplicate is for same entity
        for (FileMetadata file : duplicates) {
            if (file.getEntityType().equals(entityType) && 
                file.getEntityId().equals(entityId)) {
                return file;
            }
        }
        
        return null;
    }

    /**
     * Verify user has access to file
     */
    private void verifyAccess(FileMetadata metadata, Long userId) {
        // TODO: Implement proper access control based on entity permissions
        // For now, allow if:
        // 1. User is the uploader
        // 2. User has access to the entity (ECN, Part, etc.)
        
        if (metadata.getUploadedBy().getId().equals(userId)) {
            return; // Owner can always access
        }

        // TODO: Check entity-level permissions
        // e.g., if entityType is ECN, check if user has access to that ECN
        
        log.debug("Access check passed for user {} on file {}", userId, metadata.getId());
    }

    /**
     * Get storage type from service
     */
    private StorageType getStorageType() {
        String type = storageService.getStorageType();
        return "S3".equals(type) ? StorageType.S3 : StorageType.LOCAL;
    }

    /**
     * Calculate total storage used by user
     */
    public long getUserStorageUsage(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        return fileMetadataRepository.calculateTotalStorageByUser(user);
    }
}
