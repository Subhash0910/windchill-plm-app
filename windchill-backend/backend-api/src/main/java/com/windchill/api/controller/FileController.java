package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.FileAttachment;
import com.windchill.service.file.IFileAttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.windchill.api.security.AuthenticatedUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final IFileAttachmentService fileService;

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<FileAttachment>> listByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return ResponseEntity.ok(fileService.listByEntity(entityType, entityId));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> upload(
            @RequestParam("file")       MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId")   Long entityId,
            @RequestParam(value = "category", required = false) String category,
            @AuthenticationPrincipal AuthenticatedUser principal) throws IOException {

        String username = principal != null ? principal.getUsername() : "system";
        FileAttachment saved = fileService.store(file, entityType, entityId, username, category);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.builder().success(true).message("Uploaded").data(saved).build());
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        FileAttachment fa = fileService.getById(id);
        Path path = fileService.resolveStoragePath(fa);
        Resource resource = new PathResource(path);
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = fa.getContentType() != null
            ? fa.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + fa.getOriginalFilename() + "\"")
            .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        String username = principal != null ? principal.getUsername() : "system";
        fileService.delete(id, username);
        return ResponseEntity.noContent().build();
    }
}
