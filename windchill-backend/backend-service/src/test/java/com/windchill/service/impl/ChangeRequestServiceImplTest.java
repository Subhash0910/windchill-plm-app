package com.windchill.service.impl;

import com.windchill.common.enums.ChangeNoticeStatus;
import com.windchill.common.enums.ChangePriority;
import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.*;
import com.windchill.repository.*;
import com.windchill.service.INotificationService;
import com.windchill.service.plm.IPartService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChangeRequestServiceImplTest {

    @Mock ChangeRequestRepository  changeRequestRepo;
    @Mock ChangeOrderItemRepository changeOrderItemRepo;
    @Mock ChangeNoticeRepository    changeNoticeRepo;
    @Mock AuditLogRepository        auditLogRepo;
    @Mock IPartService              partService;
    @Mock INotificationService      notificationService;
    @Mock UserRepository            userRepo;
    @InjectMocks ChangeRequestServiceImpl service;

    private static final Long CTX_ID = 10L;
    private static final Long CR_ID  = 1L;
    private static final String CREATOR = "engineer1";
    private static final String REVIEWER = "reviewer1";

    // ── helpers ──────────────────────────────────────────────────────────────

    private ChangeRequest sampleCr() {
        ChangeRequest cr = new ChangeRequest();
        cr.setId(CR_ID);
        cr.setChangeNumber("ECR-0001");
        cr.setContextId(CTX_ID);
        cr.setTitle("Test ECR");
        cr.setDescription("A test change request");
        cr.setReason("Reason for change");
        cr.setPriority(ChangePriority.NORMAL);
        cr.setStatus(ChangeRequestStatus.DRAFT);
        cr.setCreatedBy(CREATOR);
        cr.setImpactedPartIds("1,2,3");
        cr.setCreatedAt(LocalDateTime.now());
        cr.setUpdatedAt(LocalDateTime.now());
        return cr;
    }

    // ── create ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("create")
    class Create {

        @Test @DisplayName("generates change number ECR-0001 style and sets DRAFT status")
        void success() {
            when(changeRequestRepo.countAll()).thenReturn(0L);
            when(changeRequestRepo.save(any())).thenAnswer(inv -> {
                ChangeRequest cr = inv.getArgument(0);
                cr.setId(CR_ID);
                return cr;
            });

            ChangeRequest result = service.create(CTX_ID, "Test ECR", "Description",
                "Reason", "NORMAL", List.of(1L, 2L, 3L), CREATOR);

            assertThat(result.getChangeNumber()).isEqualTo("ECR-0001");
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.DRAFT);
            assertThat(result.getCreatedBy()).isEqualTo(CREATOR);
            assertThat(result.getContextId()).isEqualTo(CTX_ID);
            assertThat(result.getImpactedPartIds()).isEqualTo("1,2,3");
            verify(changeRequestRepo).save(any());
        }

        @Test @DisplayName("sequence increments with existing count")
        void numberingSequence() {
            when(changeRequestRepo.countAll()).thenReturn(4L);
            when(changeRequestRepo.save(any())).thenAnswer(inv -> {
                ChangeRequest cr = inv.getArgument(0);
                cr.setId(CR_ID);
                return cr;
            });

            ChangeRequest result = service.create(CTX_ID, "Fifth ECR", "Desc",
                "Reason", null, List.of(), CREATOR);

            assertThat(result.getChangeNumber()).isEqualTo("ECR-0005");
        }

        @Test @DisplayName("defaults to NORMAL priority when null")
        void defaultPriority() {
            when(changeRequestRepo.countAll()).thenReturn(0L);
            when(changeRequestRepo.save(any())).thenAnswer(inv -> {
                ChangeRequest cr = inv.getArgument(0);
                cr.setId(CR_ID);
                return cr;
            });

            ChangeRequest result = service.create(CTX_ID, "Test", "Desc",
                "Reason", null, List.of(), CREATOR);

            assertThat(result.getPriority()).isEqualTo(ChangePriority.NORMAL);
        }
    }

    // ── getById ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("getById")
    class GetById {

        @Test @DisplayName("returns CR when found")
        void found() {
            ChangeRequest cr = sampleCr();
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));

            ChangeRequest result = service.getById(CR_ID);
            assertThat(result.getChangeNumber()).isEqualTo("ECR-0001");
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.DRAFT);
        }

        @Test @DisplayName("throws IllegalArgumentException when not found")
        void notFound() {
            when(changeRequestRepo.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ChangeRequest");
        }
    }

    // ── listByContext ────────────────────────────────────────────────────────

    @Nested @DisplayName("listByContext")
    class ListByContext {

        @Test @DisplayName("returns filtered list ordered by createdAt desc")
        void returnsList() {
            ChangeRequest cr = sampleCr();
            when(changeRequestRepo.findByContextIdOrderByCreatedAtDesc(CTX_ID))
                .thenReturn(List.of(cr));

            List<ChangeRequest> result = service.listByContext(CTX_ID);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getChangeNumber()).isEqualTo("ECR-0001");
        }

        @Test @DisplayName("returns empty list when no CRs in context")
        void empty() {
            when(changeRequestRepo.findByContextIdOrderByCreatedAtDesc(CTX_ID))
                .thenReturn(List.of());

            assertThat(service.listByContext(CTX_ID)).isEmpty();
        }
    }

    // ── submit ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("submit")
    class Submit {

        @Test @DisplayName("transitions DRAFT -> SUBMITTED and sets submittedBy/submittedAt")
        void success() {
            ChangeRequest cr = sampleCr();
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeRequest result = service.submit(CR_ID, CREATOR);
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.SUBMITTED);
            assertThat(result.getSubmittedBy()).isEqualTo(CREATOR);
            assertThat(result.getSubmittedAt()).isNotNull();
        }

        @Test @DisplayName("allows REJECTED -> SUBMITTED (resubmit)")
        void fromRejected() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.REJECTED);
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeRequest result = service.submit(CR_ID, REVIEWER);
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.SUBMITTED);
        }

        @Test @DisplayName("throws IllegalStateException from non-DRAFT/non-REJECTED status")
        void invalidStatus() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.APPROVED);
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));

            assertThatThrownBy(() -> service.submit(CR_ID, CREATOR))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── startReview ──────────────────────────────────────────────────────────

    @Nested @DisplayName("startReview")
    class StartReview {

        @Test @DisplayName("transitions SUBMITTED -> IN_REVIEW")
        void success() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.SUBMITTED);
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeRequest result = service.startReview(CR_ID, REVIEWER);
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.IN_REVIEW);
            assertThat(result.getReviewedBy()).isEqualTo(REVIEWER);
        }

        @Test @DisplayName("throws IllegalStateException from DRAFT")
        void fromDraftRejected() {
            ChangeRequest cr = sampleCr(); // DRAFT
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));

            assertThatThrownBy(() -> service.startReview(CR_ID, REVIEWER))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── approve ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("approve")
    class Approve {

        @Test @DisplayName("transitions IN_REVIEW -> APPROVED, creates ChangeNotice")
        void success() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.IN_REVIEW);
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(changeNoticeRepo.count()).thenReturn(0L);
            when(changeNoticeRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(partService.getPart(anyLong())).thenReturn(new Part());
            when(partService.revise(anyLong())).thenReturn(partWithIdAndRev(101L, "B"));
            when(changeOrderItemRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeRequest result = service.approve(CR_ID, REVIEWER, "Looks good");
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.APPROVED);
            assertThat(result.getReviewedBy()).isEqualTo(REVIEWER);
            assertThat(result.getResolutionComment()).isEqualTo("Looks good");

            // Auto-created ECN
            verify(changeNoticeRepo).save(argThat(n ->
                n.getChangeRequestId().equals(CR_ID) &&
                n.getStatus() == ChangeNoticeStatus.OPEN));
        }

        @Test @DisplayName("re-vises impacted parts and creates ChangeOrderItems")
        void revisesImpactedParts() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.IN_REVIEW);
            cr.setImpactedPartIds("1,2");
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(changeNoticeRepo.count()).thenReturn(0L);
            when(changeNoticeRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(partService.getPart(anyLong())).thenReturn(partWithRev("A"));
            when(partService.revise(anyLong())).thenReturn(partWithIdAndRev(101L, "B"));
            when(changeOrderItemRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.approve(CR_ID, REVIEWER, "Approved");

            verify(partService, times(2)).revise(anyLong());
            verify(changeOrderItemRepo, times(2)).save(any());
        }

        @Test @DisplayName("swallows part revise errors and continues processing")
        void handlesReviseFailure() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.IN_REVIEW);
            cr.setImpactedPartIds("1,2");
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(changeNoticeRepo.count()).thenReturn(0L);
            when(changeNoticeRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(partService.getPart(anyLong())).thenReturn(partWithRev("A"));
            when(partService.revise(1L)).thenThrow(new RuntimeException("DB down"));
            when(partService.revise(2L)).thenReturn(partWithIdAndRev(102L, "B"));
            when(changeOrderItemRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatCode(() -> service.approve(CR_ID, REVIEWER, "Approved"))
                .doesNotThrowAnyException();

            // One item was saved (for part 2), one failed silently
            verify(changeOrderItemRepo, times(1)).save(any());
        }

        @Test @DisplayName("throws IllegalStateException from DRAFT")
        void fromDraftRejected() {
            ChangeRequest cr = sampleCr(); // DRAFT
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));

            assertThatThrownBy(() -> service.approve(CR_ID, REVIEWER, "Approved"))
                .isInstanceOf(IllegalStateException.class);
        }

        private Part partWithRev(String revision) {
            Part p = new Part();
            p.setId(100L);
            p.setPartNumber("P-001");
            p.setRevision(revision);
            p.setIteration(1);
            return p;
        }

        private Part partWithIdAndRev(Long id, String revision) {
            Part p = partWithRev(revision);
            p.setId(id);
            return p;
        }
    }

    // ── reject ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("reject")
    class Reject {

        @Test @DisplayName("transitions IN_REVIEW -> REJECTED with comment")
        void success() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.IN_REVIEW);
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeRequest result = service.reject(CR_ID, REVIEWER, "Needs work");
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.REJECTED);
            assertThat(result.getResolutionComment()).isEqualTo("Needs work");
            assertThat(result.getReviewedBy()).isEqualTo(REVIEWER);
        }

        @Test @DisplayName("throws IllegalStateException from DRAFT")
        void fromDraftRejected() {
            ChangeRequest cr = sampleCr(); // DRAFT
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));

            assertThatThrownBy(() -> service.reject(CR_ID, REVIEWER, "No"))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── close / reopen ───────────────────────────────────────────────────────

    @Nested @DisplayName("close")
    class Close {

        @Test @DisplayName("transitions APPROVED -> CLOSED")
        void fromApproved() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.APPROVED);
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeRequest result = service.close(CR_ID, REVIEWER);
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.CLOSED);
            assertThat(result.getClosedBy()).isEqualTo(REVIEWER);
        }

        @Test @DisplayName("transitions REJECTED -> CLOSED")
        void fromRejected() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.REJECTED);
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeRequest result = service.close(CR_ID, REVIEWER);
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.CLOSED);
        }

        @Test @DisplayName("throws IllegalStateException from DRAFT")
        void fromDraftRejected() {
            ChangeRequest cr = sampleCr(); // DRAFT
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));

            assertThatThrownBy(() -> service.close(CR_ID, CREATOR))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested @DisplayName("reopen")
    class Reopen {

        @Test @DisplayName("transitions REJECTED -> DRAFT and clears review fields")
        void success() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.REJECTED);
            cr.setReviewedBy(REVIEWER);
            cr.setReviewedAt(LocalDateTime.now());
            cr.setResolutionComment("Needs work");
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));
            when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeRequest result = service.reopen(CR_ID, CREATOR);
            assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.DRAFT);
            assertThat(result.getResolutionComment()).isNull();
            assertThat(result.getReviewedAt()).isNull();
            assertThat(result.getReviewedBy()).isNull();
        }

        @Test @DisplayName("throws IllegalStateException from DRAFT")
        void fromDraftRejected() {
            ChangeRequest cr = sampleCr(); // DRAFT
            when(changeRequestRepo.findById(CR_ID)).thenReturn(Optional.of(cr));

            assertThatThrownBy(() -> service.reopen(CR_ID, CREATOR))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── getOrderItems ────────────────────────────────────────────────────────

    @Nested @DisplayName("getOrderItems")
    class GetOrderItems {

        @Test @DisplayName("returns linked ChangeOrderItems")
        void returnsItems() {
            ChangeOrderItem item = new ChangeOrderItem();
            item.setId(1L);
            item.setChangeRequestId(CR_ID);
            item.setOriginalPartId(10L);
            when(changeOrderItemRepo.findByChangeRequestIdOrderByIdAsc(CR_ID))
                .thenReturn(List.of(item));

            List<ChangeOrderItem> result = service.getOrderItems(CR_ID);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getOriginalPartId()).isEqualTo(10L);
        }
    }

    // ── listByStatus ─────────────────────────────────────────────────────────

    @Nested @DisplayName("listByStatus")
    class ListByStatus {

        @Test @DisplayName("returns CRs filtered by status")
        void returnsFiltered() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.IN_REVIEW);
            when(changeRequestRepo.findByStatusOrderByCreatedAtDesc(ChangeRequestStatus.IN_REVIEW))
                .thenReturn(List.of(cr));

            List<ChangeRequest> result = service.listByStatus(ChangeRequestStatus.IN_REVIEW);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(ChangeRequestStatus.IN_REVIEW);
        }
    }

    // ── listByContextAndStatus ────────────────────────────────────────────────

    @Nested @DisplayName("listByContextAndStatus")
    class ListByContextAndStatus {

        @Test @DisplayName("returns CRs filtered by context and status")
        void returnsFiltered() {
            ChangeRequest cr = sampleCr();
            cr.setStatus(ChangeRequestStatus.SUBMITTED);
            when(changeRequestRepo.findByContextIdAndStatusOrderByCreatedAtDesc(
                CTX_ID, ChangeRequestStatus.SUBMITTED)).thenReturn(List.of(cr));

            List<ChangeRequest> result =
                service.listByContextAndStatus(CTX_ID, ChangeRequestStatus.SUBMITTED);
            assertThat(result).hasSize(1);
        }
    }

    // ── listByCreator ────────────────────────────────────────────────────────

    @Nested @DisplayName("listByCreator")
    class ListByCreator {

        @Test @DisplayName("returns CRs created by username")
        void returnsByCreator() {
            ChangeRequest cr = sampleCr();
            when(changeRequestRepo.findByCreatedByOrderByCreatedAtDesc(CREATOR))
                .thenReturn(List.of(cr));

            List<ChangeRequest> result = service.listByCreator(CREATOR);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCreatedBy()).isEqualTo(CREATOR);
        }
    }

    // ── findByImpactedPart ───────────────────────────────────────────────────

    @Nested @DisplayName("findByImpactedPart")
    class FindByImpactedPart {

        @Test @DisplayName("returns CRs that reference a given part")
        void returnsMatching() {
            ChangeRequest cr = sampleCr();
            when(changeRequestRepo.findByImpactedPartId("42"))
                .thenReturn(List.of(cr));

            List<ChangeRequest> result = service.findByImpactedPart(42L);
            assertThat(result).hasSize(1);
        }
    }

    // ── releaseNotice ────────────────────────────────────────────────────────

    @Nested @DisplayName("releaseNotice")
    class ReleaseNotice {

        @Test @DisplayName("transitions OPEN -> RELEASED")
        void success() {
            ChangeNotice notice = new ChangeNotice();
            notice.setId(1L);
            notice.setNoticeNumber("ECN-0001");
            notice.setStatus(ChangeNoticeStatus.OPEN);
            notice.setContextId(CTX_ID);
            notice.setChangeRequestId(CR_ID);
            when(changeNoticeRepo.findById(1L)).thenReturn(Optional.of(notice));
            when(changeNoticeRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeNotice result = service.releaseNotice(1L, REVIEWER);
            assertThat(result.getStatus()).isEqualTo(ChangeNoticeStatus.RELEASED);
            assertThat(result.getReleasedBy()).isEqualTo(REVIEWER);
        }

        @Test @DisplayName("throws IllegalStateException if not OPEN")
        void notOpen() {
            ChangeNotice notice = new ChangeNotice();
            notice.setId(1L);
            notice.setNoticeNumber("ECN-0001");
            notice.setStatus(ChangeNoticeStatus.RELEASED);
            notice.setContextId(CTX_ID);
            when(changeNoticeRepo.findById(1L)).thenReturn(Optional.of(notice));

            assertThatThrownBy(() -> service.releaseNotice(1L, REVIEWER))
                .isInstanceOf(IllegalStateException.class);
        }
    }
}
