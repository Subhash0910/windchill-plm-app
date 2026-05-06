package com.windchill.service.plm;

import com.windchill.common.dto.PaginationRequest;
import com.windchill.common.dto.PaginatedResponse;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.plm.security.PlmAclService;
import com.windchill.service.workflow.PromotionWorkflowService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartServiceImplTest {

    @Mock PartRepository partRepository;
    @Mock BomLineRepository bomLineRepository;
    @Mock IAuditService auditService;
    @Mock PlmAclService acl;
    @Mock PromotionWorkflowService promotionWorkflowService;
    @InjectMocks PartServiceImpl partService;

    private static final Long CTX_ID = 10L;
    private static final Long PART_ID = 1L;
    private static final String USERNAME = "engineer1";

    // ── helpers ──────────────────────────────────────────────────────────────

    private static void asUser(String username) {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(username, null, List.of()));
    }

    @BeforeEach
    void setUp() {
        asUser(USERNAME);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Part samplePart() {
        Part p = new Part();
        p.setId(PART_ID);
        p.setMasterId(PART_ID);
        p.setContextId(CTX_ID);
        p.setPartNumber("P-001");
        p.setName("Test Part");
        p.setDescription("A test part");
        p.setLifecycleState(LifecycleStateEnum.INWORK);
        p.setRevision("A");
        p.setIteration(1);
        p.setIsLatest(true);
        return p;
    }

    // ── createPart ───────────────────────────────────────────────────────────

    @Nested @DisplayName("createPart")
    class CreatePart {

        @Test @DisplayName("sets lifecycle to INWORK, revision to A, iteration to 1, isLatest=true")
        void success() {
            Part input = new Part();
            input.setContextId(CTX_ID);
            input.setPartNumber("P-001");
            input.setName("Test Part");
            input.setDescription("A test part");

            when(partRepository.save(any())).thenAnswer(inv -> {
                Part saved = inv.getArgument(0);
                saved.setId(PART_ID);
                return saved;
            });

            Part result = partService.createPart(input);

            assertThat(result.getLifecycleState()).isEqualTo(LifecycleStateEnum.INWORK);
            assertThat(result.getRevision()).isEqualTo("A");
            assertThat(result.getIteration()).isEqualTo(1);
            assertThat(result.getIsLatest()).isTrue();
            verify(partRepository, times(2)).save(any());
        }

        @Test @DisplayName("sets masterId = id when masterId is null (master record)")
        void setsMasterIdOnFirstSave() {
            Part input = new Part();
            input.setContextId(CTX_ID);
            input.setPartNumber("P-001");
            input.setName("Test Part");

            when(partRepository.save(any())).thenAnswer(inv -> {
                Part saved = inv.getArgument(0);
                saved.setId(PART_ID);
                return saved;
            });

            Part result = partService.createPart(input);
            assertThat(result.getMasterId()).isEqualTo(PART_ID);
        }

        @Test @DisplayName("reuses existing revision/iteration if provided")
        void preservesGivenRevision() {
            Part input = new Part();
            input.setContextId(CTX_ID);
            input.setPartNumber("P-001");
            input.setName("Test Part");
            input.setRevision("C");
            input.setIteration(3);

            when(partRepository.save(any())).thenAnswer(inv -> {
                Part saved = inv.getArgument(0);
                saved.setId(PART_ID);
                return saved;
            });

            Part result = partService.createPart(input);
            assertThat(result.getRevision()).isEqualTo("C");
            assertThat(result.getIteration()).isEqualTo(3);
        }

        @Test @DisplayName("throws BusinessException when contextId is null")
        void nullContextId() {
            Part input = new Part();
            input.setPartNumber("P-001");
            input.setName("Test Part");

            assertThatThrownBy(() -> partService.createPart(input))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("contextId");
        }

        @Test @DisplayName("throws BusinessException when partNumber is blank")
        void blankPartNumber() {
            Part input = new Part();
            input.setContextId(CTX_ID);
            input.setName("Test Part");

            assertThatThrownBy(() -> partService.createPart(input))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("partNumber");
        }

        @Test @DisplayName("throws BusinessException when name is blank")
        void blankName() {
            Part input = new Part();
            input.setContextId(CTX_ID);
            input.setPartNumber("P-001");

            assertThatThrownBy(() -> partService.createPart(input))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("name");
        }

        @Test @DisplayName("logs CREATE audit event")
        void logsAuditEvent() {
            Part input = new Part();
            input.setContextId(CTX_ID);
            input.setPartNumber("P-001");
            input.setName("Test Part");

            when(partRepository.save(any())).thenAnswer(inv -> {
                Part saved = inv.getArgument(0);
                saved.setId(PART_ID);
                return saved;
            });

            partService.createPart(input);
            verify(auditService).log(any(), eq(PART_ID), eq("CREATE"), any());
        }
    }

    // ── getPart ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("getPart")
    class GetPart {

        @Test @DisplayName("returns part when found")
        void found() {
            Part part = samplePart();
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));

            Part result = partService.getPart(PART_ID);
            assertThat(result.getId()).isEqualTo(PART_ID);
            assertThat(result.getPartNumber()).isEqualTo("P-001");
        }

        @Test @DisplayName("throws ResourceNotFoundException when not found")
        void notFound() {
            when(partRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> partService.getPart(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Part");
        }
    }

    // ── listParts ────────────────────────────────────────────────────────────

    @Nested @DisplayName("listParts")
    class ListParts {

        @Test @DisplayName("returns parts ordered by partNumber asc")
        void returnsFilteredList() {
            Part p1 = samplePart();
            Part p2 = samplePart(); p2.setId(2L); p2.setPartNumber("P-002");
            when(partRepository.findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(CTX_ID))
                .thenReturn(List.of(p1, p2));

            List<Part> result = partService.listParts(CTX_ID);
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getPartNumber()).isEqualTo("P-001");
        }

        @Test @DisplayName("throws BusinessException when contextId is null")
        void nullContextId() {
            assertThatThrownBy(() -> partService.listParts(null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("contextId");
        }
    }

    // ── listPartsPaginated ───────────────────────────────────────────────────

    @Nested @DisplayName("listPartsPaginated")
    class ListPartsPaginated {

        @Test @DisplayName("returns PaginatedResponse with correct page info")
        void returnsPaginatedResponse() {
            Part p1 = samplePart();
            Part p2 = samplePart(); p2.setId(2L);
            when(partRepository.findByContextIdAndIsDeletedFalse(eq(CTX_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(p1, p2)));

            PaginationRequest req = new PaginationRequest();
            req.setPage(0);
            req.setSize(10);
            req.setSortBy("partNumber");
            req.setSortDir("asc");

            PaginatedResponse<Part> result = partService.listPartsPaginated(CTX_ID, req);
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(2); // PageImpl without pageable defaults size to content.size()
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test @DisplayName("throws BusinessException when contextId is null")
        void nullContextId() {
            PaginationRequest req = new PaginationRequest();
            assertThatThrownBy(() -> partService.listPartsPaginated(null, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("contextId");
        }
    }

    // ── updatePart ───────────────────────────────────────────────────────────

    @Nested @DisplayName("updatePart")
    class UpdatePart {

        @Test @DisplayName("updates name and description")
        void updatesFields() {
            Part existing = samplePart();
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(existing));
            when(partRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Part details = new Part();
            details.setName("Updated Name");
            details.setDescription("Updated Desc");

            Part result = partService.updatePart(PART_ID, details);
            assertThat(result.getName()).isEqualTo("Updated Name");
            assertThat(result.getDescription()).isEqualTo("Updated Desc");
            verify(auditService).log(any(), eq(PART_ID), eq("UPDATE"), any());
        }

        @Test @DisplayName("throws BusinessException when part is RELEASED (immutable)")
        void releasedImmutable() {
            Part existing = samplePart();
            existing.setLifecycleState(LifecycleStateEnum.RELEASED);
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(existing));

            Part details = new Part();
            details.setName("New Name");

            assertThatThrownBy(() -> partService.updatePart(PART_ID, details))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("RELEASED");
        }

        @Test @DisplayName("throws BusinessException when checked out by another user")
        void checkedOutByOther() {
            Part existing = samplePart();
            existing.setCheckedOutBy("otherUser");
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(existing));

            Part details = new Part();
            details.setName("New Name");

            assertThatThrownBy(() -> partService.updatePart(PART_ID, details))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("checked out");
        }
    }

    // ── promote ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("promote")
    class Promote {

        @Test @DisplayName("INWORK -> UNDERREVIEW starts promotion request")
        void inworkToUnderreview() {
            Part part = samplePart();
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));

            partService.promote(PART_ID, LifecycleStateEnum.UNDERREVIEW);
            verify(promotionWorkflowService).startPromotionRequest(PART_ID, LifecycleStateEnum.UNDERREVIEW);
        }

        @Test @DisplayName("UNDERREVIEW -> RELEASED transitions state")
        void underreviewToReleased() {
            Part part = samplePart();
            part.setLifecycleState(LifecycleStateEnum.UNDERREVIEW);
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));
            when(partRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Part result = partService.promote(PART_ID, LifecycleStateEnum.RELEASED);
            assertThat(result.getLifecycleState()).isEqualTo(LifecycleStateEnum.RELEASED);
            verify(auditService).log(any(), eq(PART_ID), eq("PROMOTE"), any());
        }

        @Test @DisplayName("throws BusinessException for invalid transition (e.g. INWORK -> OBSOLETE)")
        void invalidTransition() {
            Part part = samplePart(); // INWORK
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));

            assertThatThrownBy(() -> partService.promote(PART_ID, LifecycleStateEnum.OBSOLETE))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid lifecycle transition");
        }

        @Test @DisplayName("throws BusinessException when OBSOLETE part is promoted")
        void obsoleteBlocked() {
            Part part = samplePart();
            part.setLifecycleState(LifecycleStateEnum.OBSOLETE);
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));

            assertThatThrownBy(() -> partService.promote(PART_ID, LifecycleStateEnum.RELEASED))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("OBSOLETE");
        }

        @Test @DisplayName("RELEASED -> OBSOLETE is allowed")
        void releasedToObsolete() {
            Part part = samplePart();
            part.setLifecycleState(LifecycleStateEnum.RELEASED);
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));
            when(partRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Part result = partService.promote(PART_ID, LifecycleStateEnum.OBSOLETE);
            assertThat(result.getLifecycleState()).isEqualTo(LifecycleStateEnum.OBSOLETE);
        }
    }

    // ── revise ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("revise")
    class Revise {

        @Test @DisplayName("creates new iteration with incremented revision")
        void createsNewRevision() {
            Part released = samplePart();
            released.setLifecycleState(LifecycleStateEnum.RELEASED);
            released.setRevision("A");
            released.setIteration(1);
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(released));
            when(partRepository.save(any())).thenAnswer(inv -> {
                Part p = inv.getArgument(0);
                if (p.getId() == null) p.setId(99L); // simulate DB assigning ID
                return p;
            });

            Part result = partService.revise(PART_ID);
            assertThat(result.getRevision()).isEqualTo("B");
            assertThat(result.getIteration()).isEqualTo(1);
            assertThat(result.getLifecycleState()).isEqualTo(LifecycleStateEnum.INWORK);
            assertThat(result.getIsLatest()).isTrue();
            assertThat(result.getMasterId()).isEqualTo(PART_ID);
            assertThat(result.getId()).isEqualTo(99L);

            // Old revision is marked not-latest
            assertThat(released.getIsLatest()).isFalse();
            verify(partRepository, atLeastOnce()).save(released);
            verify(auditService).log(any(), eq(99L), eq("REVISE"), any());
        }

        @Test @DisplayName("increments revision Z -> AA -> AB")
        void revisionWrap() {
            Part released = samplePart();
            released.setLifecycleState(LifecycleStateEnum.RELEASED);
            released.setRevision("Z");
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(released));
            when(partRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Part result = partService.revise(PART_ID);
            assertThat(result.getRevision()).isEqualTo("AA");
        }

        @Test @DisplayName("throws BusinessException when part is not RELEASED")
        void notReleased() {
            Part part = samplePart(); // INWORK
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));

            assertThatThrownBy(() -> partService.revise(PART_ID))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("RELEASED");
        }
    }

    // ── checkout / checkin / undoCheckout ────────────────────────────────────

    @Nested @DisplayName("checkOut")
    class CheckOut {

        @Test @DisplayName("creates new iteration checked out to current user")
        void success() {
            Part current = samplePart();
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(current));
            when(partRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Part result = partService.checkOut(PART_ID);
            assertThat(result.getCheckedOutBy()).isEqualTo(USERNAME);
            assertThat(result.getIteration()).isEqualTo(2);
            assertThat(result.getIsLatest()).isTrue();
            assertThat(current.getIsLatest()).isFalse();
        }

        @Test @DisplayName("throws BusinessException when part is RELEASED")
        void releasedBlocked() {
            Part part = samplePart();
            part.setLifecycleState(LifecycleStateEnum.RELEASED);
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));

            assertThatThrownBy(() -> partService.checkOut(PART_ID))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("RELEASED");
        }

        @Test @DisplayName("throws BusinessException when already checked out")
        void alreadyCheckedOut() {
            Part part = samplePart();
            part.setCheckedOutBy(USERNAME);
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));

            assertThatThrownBy(() -> partService.checkOut(PART_ID))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already checked out");
        }
    }

    @Nested @DisplayName("checkIn")
    class CheckIn {

        @Test @DisplayName("clears checkedOutBy and updates name/description")
        void success() {
            Part working = samplePart();
            working.setCheckedOutBy(USERNAME);
            working.setIteration(2);
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(working));
            when(partRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Part result = partService.checkIn(PART_ID, "New Name", "New Desc");
            assertThat(result.getCheckedOutBy()).isNull();
            assertThat(result.getName()).isEqualTo("New Name");
            assertThat(result.getDescription()).isEqualTo("New Desc");
            verify(auditService).log(any(), eq(PART_ID), eq("CHECKIN"), any());
        }

        @Test @DisplayName("throws BusinessException when not checked out")
        void notCheckedOut() {
            Part working = samplePart(); // checkedOutBy is null
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(working));

            assertThatThrownBy(() -> partService.checkIn(PART_ID, null, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not checked out");
        }
    }

    @Nested @DisplayName("undoCheckOut")
    class UndoCheckOut {

        @Test @DisplayName("deletes working copy and restores previous iteration")
        void success() {
            Part working = samplePart();
            working.setCheckedOutBy(USERNAME);
            working.setIteration(2);
            working.setMasterId(PART_ID);
            working.setRevision("A");
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(working));

            Part previous = samplePart();
            previous.setId(99L);
            previous.setIteration(1);
            previous.setIsLatest(false);
            when(partRepository.findByMasterIdAndRevisionAndIteration(PART_ID, "A", 1))
                .thenReturn(Optional.of(previous));
            when(partRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Part result = partService.undoCheckOut(PART_ID);
            verify(partRepository).deleteById(PART_ID);
            assertThat(result.getIteration()).isEqualTo(1);
        }

        @Test @DisplayName("throws BusinessException when not checked out")
        void notCheckedOut() {
            Part working = samplePart(); // checkedOutBy is null
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(working));

            assertThatThrownBy(() -> partService.undoCheckOut(PART_ID))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not checked out");
        }
    }

    // ── whereUsed ────────────────────────────────────────────────────────────

    @Nested @DisplayName("whereUsed")
    class WhereUsed {

        @Test @DisplayName("returns parent assemblies in same context")
        void returnsParents() {
            Part child = samplePart();
            Part parent = samplePart();
            parent.setId(2L);
            parent.setPartNumber("P-002");
            parent.setName("Parent Assy");

            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(child));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(PART_ID))
                .thenReturn(List.of(2L));
            when(partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(List.of(2L)))
                .thenReturn(List.of(parent));

            List<Part> result = partService.whereUsed(PART_ID);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getPartNumber()).isEqualTo("P-002");
        }

        @Test @DisplayName("returns empty list when part is not used anywhere")
        void emptyWhenNotUsed() {
            Part child = samplePart();
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(child));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(PART_ID))
                .thenReturn(List.of());

            List<Part> result = partService.whereUsed(PART_ID);
            assertThat(result).isEmpty();
        }
    }

    // ── deletePart ───────────────────────────────────────────────────────────

    @Nested @DisplayName("deletePart")
    class DeletePart {

        @Test @DisplayName("soft-deletes part when not used in any BOM")
        void success() {
            Part part = samplePart();
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(PART_ID))
                .thenReturn(List.of());

            partService.deletePart(PART_ID);
            verify(bomLineRepository).deleteByParentPartId(PART_ID);
            verify(partRepository).deleteById(PART_ID);
            verify(auditService).log(any(), eq(PART_ID), eq("DELETE"), any());
        }

        @Test @DisplayName("throws BusinessException when part is used in BOMs")
        void usedInBom() {
            Part part = samplePart();
            when(partRepository.findById(PART_ID)).thenReturn(Optional.of(part));
            when(bomLineRepository.findDistinctParentPartIdsByChildPartId(PART_ID))
                .thenReturn(List.of(2L, 3L));

            assertThatThrownBy(() -> partService.deletePart(PART_ID))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("BOM");
        }
    }
}
