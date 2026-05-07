package com.windchill.api.document;

import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.PartDocument;
import com.windchill.repository.PartDocumentRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.plm.IAuditService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WTDocumentServiceImpl implements WTDocumentService {

    private final WTDocumentRepository   repo;
    private final PartRepository         partRepository;
    private final PartDocumentRepository partDocumentRepo;
    private final IAuditService          auditService;

    @PersistenceContext
    private EntityManager em;

    // ── list ─────────────────────────────────────────────────────────────────
    @Override
    public List<WTDocumentDto> listByContext(Long contextId, String docType) {
        if (contextId == null) return List.of();
        List<WTDocument> docs = (docType != null && !docType.isBlank())
            ? repo.findByContextIdAndDocTypeAndIsLatestTrueAndIsDeletedFalse(contextId, docType.toUpperCase())
            : repo.findByContextIdAndIsLatestTrueAndIsDeletedFalse(contextId);
        return docs.stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── get ──────────────────────────────────────────────────────────────────
    @Override
    public WTDocumentDto getById(Long id) {
        return toDto(findOrThrow(id));
    }

    // ── create ───────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public WTDocumentDto create(WTDocumentCreateRequest req, String username) {
        WTDocument doc = WTDocument.builder()
            .contextId(req.getContextId())
            .folderId(req.getFolderId())
            .docNumber(req.getDocNumber().toUpperCase().trim())
            .name(req.getName())
            .description(req.getDescription())
            .docType(req.getDocType() != null ? req.getDocType().toUpperCase() : "SPEC")
            .build();
        // BaseEntity fields not in builder - set via setters
        doc.setCreatedBy(username);
        doc.setUpdatedBy(username);

        WTDocument saved = repo.save(doc);
        if (saved.getMasterId() == null) {
            saved.setMasterId(saved.getId());
            repo.save(saved);
        }
        auditService.log(PlmEntityTypeEnum.DOCUMENT, saved.getId(), "CREATE", username);
        return toDto(saved);
    }

    // ── update ───────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public WTDocumentDto update(Long id, WTDocumentUpdateRequest req, String username) {
        WTDocument doc = findOrThrow(id);
        if (doc.getCheckedOutBy() != null && !doc.getCheckedOutBy().equals(username))
            throw new IllegalStateException("Document is checked out by " + doc.getCheckedOutBy());
        if (req.getName()        != null) doc.setName(req.getName());
        if (req.getDescription() != null) doc.setDescription(req.getDescription());
        if (req.getDocType()     != null) doc.setDocType(req.getDocType().toUpperCase());
        doc.setUpdatedBy(username);
        auditService.log(PlmEntityTypeEnum.DOCUMENT, id, "UPDATE", username);
        return toDto(repo.save(doc));
    }

    // ── promote ──────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public WTDocumentDto promote(Long id, String targetState, String username) {
        WTDocument doc = findOrThrow(id);
        if (doc.getCheckedOutBy() != null)
            throw new IllegalStateException("Cannot promote a checked-out document.");
        doc.setLifecycleState(targetState.toUpperCase());
        doc.setUpdatedBy(username);
        auditService.log(PlmEntityTypeEnum.DOCUMENT, id, "PROMOTE_" + targetState.toUpperCase(), username);
        return toDto(repo.save(doc));
    }

    // ── checkout ─────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public WTDocumentDto checkOut(Long id, String username) {
        WTDocument base = findOrThrow(id);
        if (base.getCheckedOutBy() != null)
            throw new IllegalStateException("Already checked out by " + base.getCheckedOutBy());
        if ("RELEASED".equals(base.getLifecycleState()) || "OBSOLETE".equals(base.getLifecycleState()))
            throw new IllegalStateException("Cannot check out a " + base.getLifecycleState() + " document.");

        base.setIsLatest(false);
        repo.save(base);

        WTDocument working = WTDocument.builder()
            .contextId(base.getContextId())
            .folderId(base.getFolderId())
            .masterId(base.getMasterId())
            .docNumber(base.getDocNumber())
            .name(base.getName())
            .description(base.getDescription())
            .docType(base.getDocType())
            .lifecycleState(base.getLifecycleState())
            .revision(base.getRevision())
            .iteration(base.getIteration() + 1)
            .checkedOutBy(username)
            .build();
        working.setCreatedBy(username);
        working.setUpdatedBy(username);

        WTDocument saved = repo.save(working);
        auditService.log(PlmEntityTypeEnum.DOCUMENT, id, "CHECKOUT", username);
        return toDto(saved);
    }

    // ── checkin ──────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public WTDocumentDto checkIn(Long id, String username) {
        WTDocument doc = findOrThrow(id);
        if (!username.equals(doc.getCheckedOutBy()))
            throw new IllegalStateException("Only the checkout owner can check in.");
        doc.setCheckedOutBy(null);
        doc.setUpdatedBy(username);
        auditService.log(PlmEntityTypeEnum.DOCUMENT, id, "CHECKIN", username);
        return toDto(repo.save(doc));
    }

    // ── undo checkout ────────────────────────────────────────────────────────
    @Override
    @Transactional
    public WTDocumentDto undoCheckOut(Long id, String username) {
        WTDocument working = findOrThrow(id);
        if (!username.equals(working.getCheckedOutBy()))
            throw new IllegalStateException("Only the checkout owner can undo.");
        int prevIter = working.getIteration() - 1;
        List<WTDocument> prev = em.createQuery(
            "SELECT d FROM WTDocument d WHERE d.masterId=:m AND d.revision=:r AND d.iteration=:i",
            WTDocument.class)
            .setParameter("m", working.getMasterId())
            .setParameter("r", working.getRevision())
            .setParameter("i", prevIter)
            .getResultList();
        if (!prev.isEmpty()) {
            prev.get(0).setIsLatest(true);
            repo.save(prev.get(0));
        }
        repo.delete(working);
        auditService.log(PlmEntityTypeEnum.DOCUMENT, id, "UNDO_CHECKOUT", username);
        return prev.isEmpty() ? null : toDto(prev.get(0));
    }

    // ── delete (soft) ────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void delete(Long id, String username) {
        WTDocument doc = findOrThrow(id);
        doc.setIsDeleted(true);
        doc.setUpdatedBy(username);
        repo.save(doc);
        auditService.log(PlmEntityTypeEnum.DOCUMENT, id, "DELETE", username);
    }

    // ── part links ───────────────────────────────────────────────────────────
    @Override
    public List<WTDocumentDto> listByPart(Long partId) {
        return repo.findByPartId(partId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<Part> listRelatedParts(Long docId) {
        List<Long> partIds = repo.findRelatedPartIds(docId);
        if (partIds == null || partIds.isEmpty()) {
            return List.of();
        }
        return partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(partIds);
    }

    @Override
    @Transactional
    public void linkToPart(Long docId, Long partId) {
        if (!partDocumentRepo.existsByPartIdAndDocumentId(partId, docId)) {
            partDocumentRepo.save(new PartDocument(partId, docId));
        }
    }

    @Override
    @Transactional
    public void unlinkFromPart(Long docId, Long partId) {
        partDocumentRepo.deleteByPartIdAndDocumentId(partId, docId);
    }

    // ── helpers ───────────────────────────────────────────────────────────────
    private WTDocument findOrThrow(Long id) {
        return repo.findByIdAndIsDeletedFalse(id)
            .orElseThrow(() -> new EntityNotFoundException("Document not found: " + id));
    }

    private WTDocumentDto toDto(WTDocument d) {
        return WTDocumentDto.builder()
            .id(d.getId())
            .contextId(d.getContextId())
            .folderId(d.getFolderId())
            .masterId(d.getMasterId())
            .docNumber(d.getDocNumber())
            .name(d.getName())
            .description(d.getDescription())
            .docType(d.getDocType())
            .lifecycleState(d.getLifecycleState())
            .revision(d.getRevision())
            .iteration(d.getIteration())
            .isLatest(d.getIsLatest())
            .checkedOutBy(d.getCheckedOutBy())
            .fileName(d.getFileName())
            .fileSize(d.getFileSize())
            .mimeType(d.getMimeType())
            .versionLabel(d.getRevision() + "." + d.getIteration())
            .createdBy(d.getCreatedBy())
            .updatedBy(d.getUpdatedBy())
            .createdAt(d.getCreatedAt())       // LocalDateTime - matches BaseEntity
            .updatedAt(d.getUpdatedAt())       // LocalDateTime - matches BaseEntity
            .build();
    }
}
