package com.windchill.service.document;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Document;
import com.windchill.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DocumentServiceImpl implements IDocumentService {
    private final DocumentRepository documentRepository;

    @Override
    public Document createDocument(Document document) {
        log.info("Creating new document: {}", document.getDocumentNumber());

        if (document.getDocumentNumber() == null || document.getDocumentNumber().isEmpty()) {
            throw new BusinessException("Document number cannot be empty");
        }

        Document existingDoc = documentRepository.findByDocumentNumber(document.getDocumentNumber()).orElse(null);
        if (existingDoc != null && !existingDoc.getIsDeleted()) {
            throw new BusinessException("Document number already exists: " + document.getDocumentNumber());
        }

        document.setIsDeleted(false);
        Document savedDocument = documentRepository.save(document);
        log.info("Document created successfully: {}", document.getDocumentNumber());
        return savedDocument;
    }

    @Override
    @Transactional(readOnly = true)
    public Document getDocumentById(Long id) {
        log.debug("Fetching document by id: {}", id);
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Document getDocumentByNumber(String documentNumber) {
        log.debug("Fetching document by number: {}", documentNumber);
        return documentRepository.findByDocumentNumber(documentNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "number", documentNumber));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Document> getAllDocuments() {
        log.debug("Fetching all documents");
        return documentRepository.findAllActive();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Document> getDocumentsByProject(Long projectId) {
        log.debug("Fetching documents for project: {}", projectId);
        return documentRepository.findByProjectIdAndIsDeletedFalse(projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Document> getDocumentsByStatus(StatusEnum status) {
        log.debug("Fetching documents by status: {}", status);
        return documentRepository.findByStatusAndIsDeletedFalse(status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Document> searchDocuments(String keyword) {
        log.debug("Searching documents with keyword: {}", keyword);
        return documentRepository.findByTitleContaining(keyword);
    }

    @Override
    public Document updateDocument(Long id, Document documentDetails) {
        log.info("Updating document: {}", id);
        Document document = getDocumentById(id);

        if (documentDetails.getTitle() != null) {
            document.setTitle(documentDetails.getTitle());
        }
        if (documentDetails.getDescription() != null) {
            document.setDescription(documentDetails.getDescription());
        }
        if (documentDetails.getDocumentType() != null) {
            document.setDocumentType(documentDetails.getDocumentType());
        }
        if (documentDetails.getFileName() != null) {
            document.setFileName(documentDetails.getFileName());
        }

        Document updatedDocument = documentRepository.save(document);
        log.info("Document updated successfully: {}", id);
        return updatedDocument;
    }

    @Override
    public void deleteDocument(Long id) {
        log.info("Deleting document: {}", id);
        Document document = getDocumentById(id);
        document.setIsDeleted(true);
        documentRepository.save(document);
        log.info("Document deleted successfully: {}", id);
    }

    @Override
    public Document updateDocumentStatus(Long id, StatusEnum status) {
        log.info("Updating document status: {} to {}", id, status);
        Document document = getDocumentById(id);
        document.setStatus(status);
        return documentRepository.save(document);
    }

    @Override
    public Document updateApprovalStatus(Long id, String approvalStatus, Long reviewerId) {
        log.info("Updating approval status for document: {}", id);
        Document document = getDocumentById(id);
        document.setApprovalStatus(approvalStatus);
        document.setReviewerId(reviewerId);
        return documentRepository.save(document);
    }
}
