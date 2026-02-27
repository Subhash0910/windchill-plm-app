package com.windchill.plm.controller;

import com.windchill.plm.model.FileMetadata;
import com.windchill.plm.model.User;
import com.windchill.plm.service.FileService;
import com.windchill.plm.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for file upload and management.
 * 
 * @author Subhash
 * @version 2.0
 */
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Files", description = "File upload and management API")
public class FileController {

    private final FileService fileService;
    private final UserService userService;

    /**
     * Upload a file
     */
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload file", description = "Upload a file and attach to an entity")
    public ResponseEntity<FileMetadata> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") Long entityId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category,
            Authentication authentication) {
        
        try {
            User currentUser = userService.getUserByUsername(authentication.getName());
            
            log.info("📤 Upload request: file={}, entityType={}, entityId={}, user={}",
                    file.getOriginalFilename(), entityType, entityId, currentUser.getId());
            
            // TODO: Verify user has access to this entity
            
            FileMetadata metadata = fileService.uploadFile(
                    file, entityType, entityId, currentUser, description, category);
            
            return ResponseEntity.ok(metadata);
            
        } catch (IOException e) {
            log.error("❌ File upload failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Download a file
     */
    @GetMapping("/{fileId}/download")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Download file", description = "Download a file by ID")
    public ResponseEntity<InputStreamResource> downloadFile(
            @PathVariable Long fileId,
            Authentication authentication) {
        
        try {
            User currentUser = userService.getUserByUsername(authentication.getName());
            FileMetadata metadata = fileService.getFileMetadata(fileId);
            
            // TODO: Verify user has access to this entity
            
            log.info("📥 Download request: fileId={}, user={}", fileId, currentUser.getId());
            
            InputStream fileStream = fileService.downloadFile(fileId);
            InputStreamResource resource = new InputStreamResource(fileStream);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + metadata.getOriginalFilename() + "\"")
                    .contentType(MediaType.parseMediaType(metadata.getContentType()))
                    .contentLength(metadata.getFileSize())
                    .body(resource);
            
        } catch (IOException e) {
            log.error("❌ File download failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get file metadata
     */
    @GetMapping("/{fileId}/metadata")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get file metadata", description = "Get metadata for a file")
    public ResponseEntity<FileMetadata> getFileMetadata(
            @PathVariable Long fileId,
            Authentication authentication) {
        
        try {
            FileMetadata metadata = fileService.getFileMetadata(fileId);
            return ResponseEntity.ok(metadata);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all files for an entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get entity files", description = "Get all files attached to an entity")
    public ResponseEntity<List<FileMetadata>> getEntityFiles(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(value = "category", required = false) String category,
            Authentication authentication) {
        
        // TODO: Verify user has access to this entity
        
        List<FileMetadata> files = category != null 
                ? fileService.getEntityFilesByCategory(entityType, entityId, category)
                : fileService.getEntityFiles(entityType, entityId);
        
        log.info("📁 Retrieved {} files for {}/{}", files.size(), entityType, entityId);
        
        return ResponseEntity.ok(files);
    }

    /**
     * Delete a file
     */
    @DeleteMapping("/{fileId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete file", description = "Soft delete a file")
    public ResponseEntity<Map<String, String>> deleteFile(
            @PathVariable Long fileId,
            Authentication authentication) {
        
        try {
            User currentUser = userService.getUserByUsername(authentication.getName());
            
            // TODO: Verify user has permission to delete
            
            fileService.deleteFile(fileId);
            
            log.info("🗑️ File deleted: fileId={}, user={}", fileId, currentUser.getId());
            
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
            
        } catch (Exception e) {
            log.error("❌ File deletion failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
