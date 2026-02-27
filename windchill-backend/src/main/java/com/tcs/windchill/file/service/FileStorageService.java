package com.tcs.windchill.file.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

/**
 * Storage service interface
 * 
 * Supports multiple storage backends:
 * - AWS S3
 * - Local filesystem
 * - Azure Blob (future)
 * 
 * @author Subhash
 */
public interface FileStorageService {

    /**
     * Store file and return storage path
     */
    String store(String filename, InputStream inputStream, long fileSize, String contentType) throws IOException;

    /**
     * Store multipart file
     */
    String store(String filename, MultipartFile file) throws IOException;

    /**
     * Get file as InputStream
     */
    InputStream getFile(String storagePath) throws IOException;

    /**
     * Delete file
     */
    void delete(String storagePath) throws IOException;

    /**
     * Check if file exists
     */
    boolean exists(String storagePath);

    /**
     * Generate signed URL for secure access (optional, for S3)
     */
    String generateSignedUrl(String storagePath, int expiryMinutes);

    /**
     * Get storage type
     */
    String getStorageType();
}
