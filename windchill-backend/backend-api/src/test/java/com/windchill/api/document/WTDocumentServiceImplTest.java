package com.windchill.api.document;

import com.windchill.domain.entity.Part;
import com.windchill.repository.PartRepository;
import com.windchill.service.plm.IAuditService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WTDocumentServiceImplTest {

    @Mock WTDocumentRepository repo;
    @Mock PartRepository        partRepository;
    @Mock IAuditService         auditService;
    @Mock EntityManager         em;
    @InjectMocks WTDocumentServiceImpl service;

    private static final Long   DOC_ID = 1L;
    private static final Long   CTX_ID = 10L;
    private static final String OWNER  = "alice";
    private static final String OTHER  = "bob";

    private WTDocument baseDoc;

    @BeforeEach
    void setUp() {
        // @PersistenceContext is excluded from @RequiredArgsConstructor, so inject manually
        ReflectionTestUtils.setField(service, "em", em);

        baseDoc = WTDocument.builder()
            .contextId(CTX_ID)
            .docNumber("DOC-0001")
            .name("Design Spec")
            .docType("SPEC")
            .lifecycleState("INWORK")
            .revision("A")
            .iteration(1)
            .isLatest(true)
            .build();
        baseDoc.setId(DOC_ID);
        baseDoc.setIsDeleted(false);
        baseDoc.setCreatedBy(OWNER);
        baseDoc.setUpdatedBy(OWNER);
    }

    // ── listByContext ─────────────────────────────────────────────────────────

    @Nested @DisplayName("listByContext()")
    class ListByContext {

        @Test @DisplayName("null contextId returns empty list without hitting repo")
        void nullContextId() {
            assertThat(service.listByContext(null, null)).isEmpty();
            verifyNoInteractions(repo);
        }

        @Test @DisplayName("null docType calls unfiltered query")
        void nullDocType() {
            when(repo.findByContextIdAndIsLatestTrueAndIsDeletedFalse(CTX_ID))
                .thenReturn(List.of(baseDoc));

            List<WTDocumentDto> result = service.listByContext(CTX_ID, null);

            assertThat(result).hasSize(1);
            verify(repo).findByContextIdAndIsLatestTrueAndIsDeletedFalse(CTX_ID);
        }

        @Test @DisplayName("blank docType falls through to unfiltered query")
        void blankDocType() {
            when(repo.findByContextIdAndIsLatestTrueAndIsDeletedFalse(CTX_ID))
                .thenReturn(List.of());

            service.listByContext(CTX_ID, "   ");

            verify(repo).findByContextIdAndIsLatestTrueAndIsDeletedFalse(CTX_ID);
        }

        @Test @DisplayName("non-blank docType calls type-filtered query uppercased")
        void withDocType() {
            when(repo.findByContextIdAndDocTypeAndIsLatestTrueAndIsDeletedFalse(CTX_ID, "DRAWING"))
                .thenReturn(List.of(baseDoc));

            service.listByContext(CTX_ID, "drawing");

            verify(repo).findByContextIdAndDocTypeAndIsLatestTrueAndIsDeletedFalse(CTX_ID, "DRAWING");
        }

        @Test @DisplayName("maps WTDocument to DTO with correct versionLabel")
        void mapsToDto() {
            when(repo.findByContextIdAndIsLatestTrueAndIsDeletedFalse(CTX_ID))
                .thenReturn(List.of(baseDoc));

            WTDocumentDto dto = service.listByContext(CTX_ID, null).get(0);

            assertThat(dto.getDocNumber()).isEqualTo("DOC-0001");
            assertThat(dto.getVersionLabel()).isEqualTo("A.1");
            assertThat(dto.getContextId()).isEqualTo(CTX_ID);
        }
    }

    // ── getById ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("getById()")
    class GetById {

        @Test @DisplayName("returns DTO when document exists")
        void found() {
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            WTDocumentDto dto = service.getById(DOC_ID);

            assertThat(dto.getId()).isEqualTo(DOC_ID);
            assertThat(dto.getDocNumber()).isEqualTo("DOC-0001");
        }

        @Test @DisplayName("throws EntityNotFoundException for missing document")
        void notFound() {
            when(repo.findByIdAndIsDeletedFalse(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
        }
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("create()")
    class Create {

        @Test @DisplayName("saves document, sets masterId on second save, calls audit")
        void happyPath() {
            WTDocumentCreateRequest req = new WTDocumentCreateRequest();
            req.setContextId(CTX_ID);
            req.setDocNumber("doc-0001");
            req.setName("Design Spec");
            req.setDocType("DRAWING");

            WTDocument firstSave = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0001").name("Design Spec")
                .docType("DRAWING").build();
            firstSave.setId(DOC_ID); // masterId is null after first save

            WTDocument secondSave = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0001").name("Design Spec")
                .docType("DRAWING").build();
            secondSave.setId(DOC_ID);
            secondSave.setMasterId(DOC_ID);

            when(repo.save(any())).thenReturn(firstSave, secondSave);

            WTDocumentDto dto = service.create(req, OWNER);

            assertThat(dto.getDocNumber()).isEqualTo("DOC-0001");
            verify(repo, times(2)).save(any());
            verify(auditService).log(any(), eq(DOC_ID), eq("CREATE"), eq(OWNER));
        }

        @Test @DisplayName("docNumber is uppercased and trimmed before save")
        void docNumberNormalized() {
            WTDocumentCreateRequest req = new WTDocumentCreateRequest();
            req.setContextId(CTX_ID);
            req.setDocNumber("  doc-lowercased  ");
            req.setName("Spec");

            WTDocument saved = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-LOWERCASED").name("Spec").build();
            saved.setId(DOC_ID);
            when(repo.save(any())).thenReturn(saved);

            service.create(req, OWNER);

            verify(repo, atLeastOnce()).save(argThat(d -> "DOC-LOWERCASED".equals(d.getDocNumber())));
        }

        @Test @DisplayName("docType defaults to SPEC when not provided")
        void defaultDocType() {
            WTDocumentCreateRequest req = new WTDocumentCreateRequest();
            req.setContextId(CTX_ID);
            req.setDocNumber("DOC-0002");
            req.setName("My Doc");
            req.setDocType(null);

            WTDocument saved = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0002").name("My Doc").build();
            saved.setId(DOC_ID);
            when(repo.save(any())).thenReturn(saved);

            service.create(req, OWNER);

            verify(repo, atLeastOnce()).save(argThat(d -> "SPEC".equals(d.getDocType())));
        }

        @Test @DisplayName("skips second save when masterId is already populated")
        void skipsMasterIdSave() {
            WTDocumentCreateRequest req = new WTDocumentCreateRequest();
            req.setContextId(CTX_ID);
            req.setDocNumber("DOC-0003");
            req.setName("Pre-mastered doc");

            WTDocument saved = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0003").name("Pre-mastered doc").build();
            saved.setId(DOC_ID);
            saved.setMasterId(DOC_ID);
            when(repo.save(any())).thenReturn(saved);

            service.create(req, OWNER);

            verify(repo, times(1)).save(any());
        }

        @Test @DisplayName("stamps createdBy and updatedBy on new document")
        void auditsCreator() {
            WTDocumentCreateRequest req = new WTDocumentCreateRequest();
            req.setContextId(CTX_ID);
            req.setDocNumber("DOC-0004");
            req.setName("Audited doc");

            WTDocument saved = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0004").name("Audited doc").build();
            saved.setId(DOC_ID);
            when(repo.save(any())).thenReturn(saved);

            service.create(req, OWNER);

            verify(repo).save(argThat(d ->
                OWNER.equals(d.getCreatedBy()) && OWNER.equals(d.getUpdatedBy())));
        }
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("update()")
    class Update {

        @Test @DisplayName("updates provided fields and uppercases docType")
        void happyPath() {
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WTDocumentUpdateRequest req = new WTDocumentUpdateRequest();
            req.setName("Updated Spec");
            req.setDocType("drawing");

            WTDocumentDto dto = service.update(DOC_ID, req, OWNER);

            assertThat(dto.getName()).isEqualTo("Updated Spec");
            assertThat(dto.getDocType()).isEqualTo("DRAWING");
            verify(auditService).log(any(), eq(DOC_ID), eq("UPDATE"), eq(OWNER));
        }

        @Test @DisplayName("null fields in request leave existing values unchanged")
        void nullFieldsIgnored() {
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WTDocumentUpdateRequest req = new WTDocumentUpdateRequest(); // all null

            WTDocumentDto dto = service.update(DOC_ID, req, OWNER);

            assertThat(dto.getName()).isEqualTo("Design Spec");
            assertThat(dto.getDocType()).isEqualTo("SPEC");
        }

        @Test @DisplayName("throws IllegalStateException when checked out by different user")
        void checkedOutByOther() {
            baseDoc.setCheckedOutBy(OTHER);
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            WTDocumentUpdateRequest req = new WTDocumentUpdateRequest();
            req.setName("Sneaky update");

            assertThatThrownBy(() -> service.update(DOC_ID, req, OWNER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(OTHER);
        }

        @Test @DisplayName("owner can update their own checked-out document")
        void ownerCanUpdateCheckedOut() {
            baseDoc.setCheckedOutBy(OWNER);
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WTDocumentUpdateRequest req = new WTDocumentUpdateRequest();
            req.setDescription("Updated desc");

            assertThatCode(() -> service.update(DOC_ID, req, OWNER)).doesNotThrowAnyException();
        }
    }

    // ── promote ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("promote()")
    class Promote {

        @Test @DisplayName("advances lifecycle state and uppercases target")
        void happyPath() {
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WTDocumentDto dto = service.promote(DOC_ID, "released", OWNER);

            assertThat(dto.getLifecycleState()).isEqualTo("RELEASED");
            verify(auditService).log(any(), eq(DOC_ID), eq("PROMOTE_RELEASED"), eq(OWNER));
        }

        @Test @DisplayName("throws IllegalStateException when document is checked out")
        void checkedOutBlocked() {
            baseDoc.setCheckedOutBy(OWNER);
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            assertThatThrownBy(() -> service.promote(DOC_ID, "RELEASED", OWNER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("checked-out");
        }
    }

    // ── checkOut ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("checkOut()")
    class CheckOut {

        @Test @DisplayName("creates working copy at iteration+1 and marks base not-latest")
        void happyPath() {
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            WTDocument working = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0001").name("Design Spec")
                .docType("SPEC").lifecycleState("INWORK").revision("A").iteration(2)
                .isLatest(true).checkedOutBy(OWNER).build();
            working.setId(2L);

            when(repo.save(any())).thenReturn(baseDoc, working);

            WTDocumentDto dto = service.checkOut(DOC_ID, OWNER);

            assertThat(dto.getCheckedOutBy()).isEqualTo(OWNER);
            assertThat(dto.getIteration()).isEqualTo(2);
            assertThat(baseDoc.getIsLatest()).isFalse();
            verify(auditService).log(any(), eq(DOC_ID), eq("CHECKOUT"), eq(OWNER));
        }

        @Test @DisplayName("throws when already checked out by anyone")
        void alreadyCheckedOut() {
            baseDoc.setCheckedOutBy(OTHER);
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            assertThatThrownBy(() -> service.checkOut(DOC_ID, OWNER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Already checked out");
        }

        @Test @DisplayName("throws for RELEASED document")
        void releasedBlocked() {
            baseDoc.setLifecycleState("RELEASED");
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            assertThatThrownBy(() -> service.checkOut(DOC_ID, OWNER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RELEASED");
        }

        @Test @DisplayName("throws for OBSOLETE document")
        void obsoleteBlocked() {
            baseDoc.setLifecycleState("OBSOLETE");
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            assertThatThrownBy(() -> service.checkOut(DOC_ID, OWNER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("OBSOLETE");
        }
    }

    // ── checkIn ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("checkIn()")
    class CheckIn {

        @Test @DisplayName("clears checkedOutBy for the checkout owner")
        void happyPath() {
            baseDoc.setCheckedOutBy(OWNER);
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            WTDocumentDto dto = service.checkIn(DOC_ID, OWNER);

            assertThat(dto.getCheckedOutBy()).isNull();
            verify(auditService).log(any(), eq(DOC_ID), eq("CHECKIN"), eq(OWNER));
        }

        @Test @DisplayName("throws IllegalStateException when non-owner attempts check-in")
        void nonOwnerBlocked() {
            baseDoc.setCheckedOutBy(OTHER);
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            assertThatThrownBy(() -> service.checkIn(DOC_ID, OWNER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("checkout owner");
        }
    }

    // ── undoCheckOut ──────────────────────────────────────────────────────────

    @Nested @DisplayName("undoCheckOut()")
    class UndoCheckOut {

        @Test @DisplayName("throws IllegalStateException when non-owner attempts undo")
        void nonOwnerBlocked() {
            baseDoc.setCheckedOutBy(OTHER);
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));

            assertThatThrownBy(() -> service.undoCheckOut(DOC_ID, OWNER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("checkout owner");
        }

        @Test @DisplayName("restores previous iteration as latest and deletes working copy")
        void happyPath() {
            WTDocument working = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0001").name("Design Spec")
                .docType("SPEC").lifecycleState("INWORK").revision("A").iteration(2)
                .masterId(DOC_ID).isLatest(true).checkedOutBy(OWNER).build();
            working.setId(2L);

            WTDocument prev = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0001").name("Design Spec")
                .docType("SPEC").lifecycleState("INWORK").revision("A").iteration(1)
                .masterId(DOC_ID).isLatest(false).build();
            prev.setId(DOC_ID);

            when(repo.findByIdAndIsDeletedFalse(2L)).thenReturn(Optional.of(working));

            @SuppressWarnings("unchecked")
            TypedQuery<WTDocument> q = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(WTDocument.class))).thenReturn(q);
            when(q.setParameter(anyString(), any())).thenReturn(q);
            when(q.getResultList()).thenReturn(List.of(prev));
            when(repo.save(prev)).thenReturn(prev);

            WTDocumentDto dto = service.undoCheckOut(2L, OWNER);

            assertThat(dto.getIteration()).isEqualTo(1);
            verify(repo).delete(working);
            verify(repo).save(argThat(d -> Boolean.TRUE.equals(d.getIsLatest())));
            verify(auditService).log(any(), eq(2L), eq("UNDO_CHECKOUT"), eq(OWNER));
        }

        @Test @DisplayName("returns null when no previous iteration exists")
        void noPreviousIteration() {
            WTDocument working = WTDocument.builder()
                .contextId(CTX_ID).docNumber("DOC-0001").name("Design Spec")
                .docType("SPEC").lifecycleState("INWORK").revision("A").iteration(1)
                .masterId(DOC_ID).isLatest(true).checkedOutBy(OWNER).build();
            working.setId(2L);

            when(repo.findByIdAndIsDeletedFalse(2L)).thenReturn(Optional.of(working));

            @SuppressWarnings("unchecked")
            TypedQuery<WTDocument> q = mock(TypedQuery.class);
            when(em.createQuery(anyString(), eq(WTDocument.class))).thenReturn(q);
            when(q.setParameter(anyString(), any())).thenReturn(q);
            when(q.getResultList()).thenReturn(List.of());

            WTDocumentDto dto = service.undoCheckOut(2L, OWNER);

            assertThat(dto).isNull();
            verify(repo).delete(working);
        }
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("delete()")
    class Delete {

        @Test @DisplayName("soft-deletes document and calls audit")
        void softDelete() {
            when(repo.findByIdAndIsDeletedFalse(DOC_ID)).thenReturn(Optional.of(baseDoc));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.delete(DOC_ID, OWNER);

            verify(repo).save(argThat(d ->
                Boolean.TRUE.equals(d.getIsDeleted()) && OWNER.equals(d.getUpdatedBy())));
            verify(auditService).log(any(), eq(DOC_ID), eq("DELETE"), eq(OWNER));
        }

        @Test @DisplayName("throws EntityNotFoundException for missing document")
        void missingDoc() {
            when(repo.findByIdAndIsDeletedFalse(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete(99L, OWNER))
                .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ── listByPart ────────────────────────────────────────────────────────────

    @Nested @DisplayName("listByPart()")
    class ListByPart {

        @Test @DisplayName("delegates to repo and maps to DTOs")
        void delegatesAndMaps() {
            when(repo.findByPartId(5L)).thenReturn(List.of(baseDoc));

            List<WTDocumentDto> result = service.listByPart(5L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDocNumber()).isEqualTo("DOC-0001");
        }

        @Test @DisplayName("returns empty list when part has no documents")
        void emptyResult() {
            when(repo.findByPartId(5L)).thenReturn(List.of());
            assertThat(service.listByPart(5L)).isEmpty();
        }
    }

    // ── listRelatedParts ──────────────────────────────────────────────────────

    @Nested @DisplayName("listRelatedParts()")
    class ListRelatedParts {

        @Test @DisplayName("returns empty list when no part IDs found — does not hit part repo")
        void emptyPartIds() {
            when(repo.findRelatedPartIds(DOC_ID)).thenReturn(List.of());

            assertThat(service.listRelatedParts(DOC_ID)).isEmpty();
            verifyNoInteractions(partRepository);
        }

        @Test @DisplayName("queries part repository with found IDs")
        void queriesPartRepo() {
            Part part = new Part();
            when(repo.findRelatedPartIds(DOC_ID)).thenReturn(List.of(3L, 4L));
            when(partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(List.of(3L, 4L)))
                .thenReturn(List.of(part));

            List<Part> result = service.listRelatedParts(DOC_ID);

            assertThat(result).hasSize(1);
        }

        @Test @DisplayName("handles null from repo gracefully")
        void nullFromRepo() {
            when(repo.findRelatedPartIds(DOC_ID)).thenReturn(null);
            assertThat(service.listRelatedParts(DOC_ID)).isEmpty();
            verifyNoInteractions(partRepository);
        }
    }

    // ── linkToPart / unlinkFromPart ───────────────────────────────────────────

    @Nested @DisplayName("linkToPart() / unlinkFromPart()")
    class PartLinks {

        @Test @DisplayName("linkToPart executes INSERT IGNORE native query")
        void link() {
            Query nq = mock(Query.class);
            when(em.createNativeQuery(anyString())).thenReturn(nq);
            when(nq.setParameter(anyString(), any())).thenReturn(nq);

            service.linkToPart(DOC_ID, 5L);

            verify(em).createNativeQuery(contains("INSERT IGNORE"));
            verify(nq).setParameter("p", 5L);
            verify(nq).setParameter("d", DOC_ID);
            verify(nq).executeUpdate();
        }

        @Test @DisplayName("unlinkFromPart executes DELETE native query")
        void unlink() {
            Query nq = mock(Query.class);
            when(em.createNativeQuery(anyString())).thenReturn(nq);
            when(nq.setParameter(anyString(), any())).thenReturn(nq);

            service.unlinkFromPart(DOC_ID, 5L);

            verify(em).createNativeQuery(contains("DELETE FROM part_documents"));
            verify(nq).setParameter("p", 5L);
            verify(nq).setParameter("d", DOC_ID);
            verify(nq).executeUpdate();
        }
    }
}
