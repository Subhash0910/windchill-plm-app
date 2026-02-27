package com.windchill.plm.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Local filesystem storage implementation.
 * Stores files in local directory (configurable).
 * 
 * @author Subhash
 */
@Service("localStorageService")
@Slf4j
public class LocalStorageService implements FileStorageService {

    private final Path rootLocation;

    public LocalStorageService(
            @Value("${app.file-storage.local.path:/opt/windchill/files}") String uploadPath) {
        this.rootLocation = Paths.get(uploadPath);
        try {
            Files.createDirectories(this.rootLocation);
            log.info("📁 Local storage initialized: {}", this.rootLocation.toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    @Override
    public String store(MultipartFile file, String storagePath) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("Failed to store empty file");
        }

        // Resolve path and create directories
        Path destinationPath = this.rootLocation.resolve(storagePath).normalize();
        
        // Security: Prevent path traversal attacks
        if (!destinationPath.startsWith(this.rootLocation)) {
            throw new IOException("Cannot store file outside root directory");
        }

        // Create parent directories if needed
        Files.createDirectories(destinationPath.getParent());

        // Copy file
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationPath, StandardCopyOption.REPLACE_EXISTING);
        }

        log.info("✅ File stored locally: {}", destinationPath);
        return storagePath;
    }

    @Override
    public InputStream load(String storagePath) throws IOException {
        Path file = this.rootLocation.resolve(storagePath).normalize();
        
        if (!file.startsWith(this.rootLocation)) {
            throw new IOException("Cannot read file outside root directory");
        }
        
        if (!Files.exists(file)) {
            throw new IOException("File not found: " + storagePath);
        }

        return new FileInputStream(file.toFile());
    }

    @Override
    public void delete(String storagePath) throws IOException {
        Path file = this.rootLocation.resolve(storagePath).normalize();
        
        if (!file.startsWith(this.rootLocation)) {
            throw new IOException("Cannot delete file outside root directory");
        }

        Files.deleteIfExists(file);
        log.info("🗑️ File deleted: {}", storagePath);
    }

    @Override
    public boolean exists(String storagePath) {
        Path file = this.rootLocation.resolve(storagePath).normalize();
        return Files.exists(file);
    }

    @Override
    public String getStorageType() {
        return "LOCAL";
    }
}
