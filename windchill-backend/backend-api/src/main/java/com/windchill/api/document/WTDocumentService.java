package com.windchill.api.document;

import java.util.List;

public interface WTDocumentService {
    List<WTDocumentDto> listByContext(Long contextId, String docType);
    WTDocumentDto       getById(Long id);
    WTDocumentDto       create(WTDocumentCreateRequest req, String username);
    WTDocumentDto       update(Long id, WTDocumentUpdateRequest req, String username);
    WTDocumentDto       promote(Long id, String targetState, String username);
    WTDocumentDto       checkOut(Long id, String username);
    WTDocumentDto       checkIn(Long id, String username);
    WTDocumentDto       undoCheckOut(Long id, String username);
    void                delete(Long id, String username);
    List<WTDocumentDto> listByPart(Long partId);
    void                linkToPart(Long docId, Long partId);
    void                unlinkFromPart(Long docId, Long partId);
}
