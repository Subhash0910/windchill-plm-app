package com.windchill.plm.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * Interface for file storage services.
 * Implementations: LocalStorageService, S3StorageService
 * 
 * @author Subhash
 */
public interface FileStorageService {

    /**
     * Store a file
     * 
     * @param file File to store
     * @param storagePath Path where file should be stored
     * @return Actual storage path
     * @throws IOException if storage fails
     */
    String store(MultipartFile file, String storagePath) throws IOException;

    /**
     * Load a file as InputStream
     * 
     * @param storagePath Path to the file
     * @return InputStream of the file
     * @throws IOException if file not found
     */
    InputStream load(String storagePath) throws IOException;

    /**
     * Delete a file
     * 
     * @param storagePath Path to the file
     * @throws IOException if deletion fails
     */
    void delete(String storagePath) throws IOException;

    /**
     * Check if file exists
     * 
     * @param storagePath Path to check
     * @return true if file exists
     */
    boolean exists(String storagePath);

    /**
     * Get storage type identifier
     * 
     * @return "S3" or "LOCAL"
     */
    String getStorageType();
}
