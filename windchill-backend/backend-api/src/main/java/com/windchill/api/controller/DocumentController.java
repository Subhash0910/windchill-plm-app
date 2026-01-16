package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Document;
import com.windchill.service.document.IDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(APIConstants.API_DOCUMENTS)
@RequiredArgsConstructor
@Slf4j
public class DocumentController {
    private final IDocumentService documentService;

    @PostMapping
    public ResponseEntity<ApiResponse<Document>> createDocument(@RequestBody Document document) {
        log.info("Creating new document: {}", document.getDocumentNumber());
        Document createdDocument = documentService.createDocument(document);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(APIConstants.CREATED, createdDocument, true));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Document>> getDocumentById(@PathVariable Long id) {
        log.info("Fetching document by id: {}", id);
        Document document = documentService.getDocumentById(id);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, document, true));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Document>>> getAllDocuments() {
        log.info("Fetching all documents");
        List<Document> documents = documentService.getAllDocuments();
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, documents, true));
    }

    @GetMapping("/number/{documentNumber}")
    public ResponseEntity<ApiResponse<Document>> getDocumentByNumber(@PathVariable String documentNumber) {
        log.info("Fetching document by number: {}", documentNumber);
        Document document = documentService.getDocumentByNumber(documentNumber);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, document, true));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Document>>> getDocumentsByProject(@PathVariable Long projectId) {
        log.info("Fetching documents for project: {}", projectId);
        List<Document> documents = documentService.getDocumentsByProject(projectId);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, documents, true));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Document>>> searchDocuments(@RequestParam String keyword) {
        log.info("Searching documents with keyword: {}", keyword);
        List<Document> documents = documentService.searchDocuments(keyword);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, documents, true));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Document>> updateDocument(@PathVariable Long id, @RequestBody Document documentDetails) {
        log.info("Updating document: {}", id);
        Document updatedDocument = documentService.updateDocument(id, documentDetails);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.UPDATED, updatedDocument, true));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Document>> updateDocumentStatus(@PathVariable Long id, @RequestParam StatusEnum status) {
        log.info("Updating document status: {} to {}", id, status);
        Document updatedDocument = documentService.updateDocumentStatus(id, status);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.UPDATED, updatedDocument, true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable Long id) {
        log.info("Deleting document: {}", id);
        documentService.deleteDocument(id);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.DELETED, null, true));
    }
}
