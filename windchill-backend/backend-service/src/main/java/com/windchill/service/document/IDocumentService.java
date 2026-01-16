package com.windchill.service.document;

import com.windchill.domain.entity.Document;
import com.windchill.common.enums.StatusEnum;

import java.util.List;

public interface IDocumentService {
    Document createDocument(Document document);
    
    Document getDocumentById(Long id);
    
    Document getDocumentByNumber(String documentNumber);
    
    List<Document> getAllDocuments();
    
    List<Document> getDocumentsByProject(Long projectId);
    
    List<Document> getDocumentsByStatus(StatusEnum status);
    
    List<Document> searchDocuments(String keyword);
    
    Document updateDocument(Long id, Document documentDetails);
    
    void deleteDocument(Long id);
    
    Document updateDocumentStatus(Long id, StatusEnum status);
    
    Document updateApprovalStatus(Long id, String approvalStatus, Long reviewerId);
}
