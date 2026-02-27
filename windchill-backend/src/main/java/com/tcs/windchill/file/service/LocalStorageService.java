package com.tcs.windchill.file.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Local filesystem storage service
 * 
 * Stores files in local directory:
 * /opt/windchill/files/{contextId}/{entityType}/{entityId}/
 * 
 * @author Subhash
 */
@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "local", matchIfMissing = true)
@Slf4j
public class LocalStorageService implements FileStorageService {

    @Value("${file.storage.local.base-path:/opt/windchill/files}")
    private String basePath;

    @Override
    public String store(String filename, InputStream inputStream, long fileSize, String contentType) throws IOException {
        try {
            // Create directory structure if it doesn't exist
            Path filePath = Paths.get(basePath, filename);
            Files.createDirectories(filePath.getParent());

            // Copy file to destination
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("✅ File stored locally: {}", filePath);

            return filename; // Relative path from base
        } catch (IOException e) {
            log.error("❌ Local storage failed for {}: {}", filename, e.getMessage());
            throw new IOException("Failed to store file locally: " + e.getMessage(), e);
        } finally {
            inputStream.close();
        }
    }

    @Override
    public String store(String filename, MultipartFile file) throws IOException {
        return store(filename, file.getInputStream(), file.getSize(), file.getContentType());
    }

    @Override
    public InputStream getFile(String storagePath) throws IOException {
        try {
            Path filePath = Paths.get(basePath, storagePath);
            
            if (!Files.exists(filePath)) {
                throw new FileNotFoundException("File not found: " + storagePath);
            }

            return new FileInputStream(filePath.toFile());
        } catch (IOException e) {
            log.error("❌ Local file read failed for {}: {}", storagePath, e.getMessage());
            throw e;
        }
    }

    @Override
    public void delete(String storagePath) throws IOException {
        try {
            Path filePath = Paths.get(basePath, storagePath);
            Files.deleteIfExists(filePath);
            log.info("🗑️ File deleted locally: {}", filePath);
        } catch (IOException e) {
            log.error("❌ Local file delete failed for {}: {}", storagePath, e.getMessage());
            throw new IOException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(String storagePath) {
        Path filePath = Paths.get(basePath, storagePath);
        return Files.exists(filePath);
    }

    @Override
    public String generateSignedUrl(String storagePath, int expiryMinutes) {
        // Local storage doesn't support signed URLs
        // Return API endpoint for download
        return null; // Will use direct download endpoint
    }

    @Override
    public String getStorageType() {
        return "LOCAL";
    }
}
