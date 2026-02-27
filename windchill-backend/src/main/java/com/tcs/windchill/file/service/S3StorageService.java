package com.tcs.windchill.file.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Date;

/**
 * AWS S3 storage service
 * 
 * Features:
 * - Upload to S3
 * - Download from S3
 * - Generate signed URLs
 * - Multipart upload for large files
 * 
 * @author Subhash
 */
@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "s3")
@Slf4j
public class S3StorageService implements FileStorageService {

    private final AmazonS3 s3Client;
    
    @Value("${aws.s3.bucket}")
    private String bucketName;

    public S3StorageService(AmazonS3 s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String store(String filename, InputStream inputStream, long fileSize, String contentType) throws IOException {
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(fileSize);
            metadata.setContentType(contentType);

            PutObjectRequest request = new PutObjectRequest(
                bucketName,
                filename,
                inputStream,
                metadata
            );

            s3Client.putObject(request);
            log.info("✅ File uploaded to S3: s3://{}/{}", bucketName, filename);
            
            return filename; // S3 key is the storage path
        } catch (Exception e) {
            log.error("❌ S3 upload failed for {}: {}", filename, e.getMessage());
            throw new IOException("Failed to upload to S3: " + e.getMessage(), e);
        }
    }

    @Override
    public String store(String filename, MultipartFile file) throws IOException {
        return store(filename, file.getInputStream(), file.getSize(), file.getContentType());
    }

    @Override
    public InputStream getFile(String storagePath) throws IOException {
        try {
            S3Object s3Object = s3Client.getObject(bucketName, storagePath);
            return s3Object.getObjectContent();
        } catch (Exception e) {
            log.error("❌ S3 download failed for {}: {}", storagePath, e.getMessage());
            throw new IOException("Failed to download from S3: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String storagePath) throws IOException {
        try {
            s3Client.deleteObject(bucketName, storagePath);
            log.info("🗑️ File deleted from S3: s3://{}/{}", bucketName, storagePath);
        } catch (Exception e) {
            log.error("❌ S3 delete failed for {}: {}", storagePath, e.getMessage());
            throw new IOException("Failed to delete from S3: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(String storagePath) {
        try {
            return s3Client.doesObjectExist(bucketName, storagePath);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String generateSignedUrl(String storagePath, int expiryMinutes) {
        try {
            Date expiration = new Date(System.currentTimeMillis() + (expiryMinutes * 60 * 1000));
            URL url = s3Client.generatePresignedUrl(bucketName, storagePath, expiration);
            return url.toString();
        } catch (Exception e) {
            log.error("❌ Failed to generate signed URL: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public String getStorageType() {
        return "S3";
    }
}
