package com.windchill.api.document;

import com.windchill.common.dto.PaginatedResponse;
import com.windchill.common.dto.PaginationRequest;
import com.windchill.domain.entity.Part;

import java.util.List;

public interface WTDocumentService {
    List<WTDocumentDto> listByContext(Long contextId, String docType);
    PaginatedResponse<WTDocumentDto> listPaginated(Long contextId, PaginationRequest pagination);
    WTDocumentDto       getById(Long id);
    WTDocumentDto       create(WTDocumentCreateRequest req, String username);
    WTDocumentDto       update(Long id, WTDocumentUpdateRequest req, String username);
    WTDocumentDto       promote(Long id, String targetState, String username);
    WTDocumentDto       checkOut(Long id, String username);
    WTDocumentDto       checkIn(Long id, String username);
    WTDocumentDto       undoCheckOut(Long id, String username);
    void                delete(Long id, String username);
    List<WTDocumentDto> listByPart(Long partId);
    List<Part>          listRelatedParts(Long docId);
    void                linkToPart(Long docId, Long partId);
    void                unlinkFromPart(Long docId, Long partId);
}
