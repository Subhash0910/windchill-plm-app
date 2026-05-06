package com.windchill.service.impl;

import com.windchill.common.enums.ChangePriority;
import com.windchill.common.enums.ChangeNoticeStatus;
import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.domain.entity.*;
import com.windchill.repository.*;
import com.windchill.service.INotificationService;
import com.windchill.service.plm.IPartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChangeRequestServiceImplTest {

    @Mock ChangeRequestRepository  changeRequestRepo;
    @Mock ChangeOrderItemRepository changeOrderItemRepo;
    @Mock ChangeNoticeRepository    changeNoticeRepo;
    @Mock AuditLogRepository        auditLogRepo;
    @Mock IPartService              partService;
    @Mock INotificationService      notificationService;
    @Mock UserRepository            userRepo;

    @InjectMocks ChangeRequestServiceImpl service;

    private ChangeRequest draft;
    private User alice;

    @BeforeEach
    void setUp() {
        draft = new ChangeRequest();
        draft.setId(1L);
        draft.setChangeNumber("ECR-0001");
        draft.setContextId(10L);
        draft.setTitle("Test ECR");
        draft.setStatus(ChangeRequestStatus.DRAFT);
        draft.setCreatedBy("alice");
        draft.setImpactedPartIds("");

        alice = new User();
        alice.setId(99L);
        alice.setUsername("alice");

        when(changeRequestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(changeNoticeRepo.save(any())).thenAnswer(inv -> {
            ChangeNotice n = inv.getArgument(0);
            if (n.getId() == null) n.setId(100L);
            return n;
        });
        when(auditLogRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    // ── create ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("create")
    class Create {

        @Test @DisplayName("ECR number sequenced from repo count")
        void numberSequenced() {
            when(changeRequestRepo.countAll()).thenReturn(0L);
            service.create(10L, "Title", null, null, null, null, "alice");
            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getChangeNumber()).isEqualTo("ECR-0001");
        }

        @Test @DisplayName("starts in DRAFT with NORMAL priority default")
        void defaults() {
            when(changeRequestRepo.countAll()).thenReturn(4L);
            service.create(10L, "Title", "desc", "reason", null, null, "alice");
            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeRequestStatus.DRAFT);
            assertThat(cap.getValue().getPriority()).isEqualTo(ChangePriority.NORMAL);
        }

        @Test @DisplayName("custom priority parsed case-insensitively")
        void customPriority() {
            when(changeRequestRepo.countAll()).thenReturn(0L);
            service.create(10L, "T", null, null, "high", null, "alice");
            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getPriority()).isEqualTo(ChangePriority.HIGH);
        }

        @Test @DisplayName("impacted part IDs encoded as comma-separated string")
        void partIdsEncoded() {
            when(changeRequestRepo.countAll()).thenReturn(0L);
            service.create(10L, "T", null, null, null, List.of(1L, 2L, 3L), "alice");
            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getImpactedPartIds()).isEqualTo("1,2,3");
        }
    }

    // ── getById ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("getById")
    class GetById {

        @Test @DisplayName("returns entity when found")
        void found() {
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            assertThat(service.getById(1L)).isSameAs(draft);
        }

        @Test @DisplayName("throws IllegalArgumentException when missing")
        void missing() {
            when(changeRequestRepo.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── submit ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("submit")
    class Submit {

        @Test @DisplayName("DRAFT → SUBMITTED, sets submittedBy + timestamp")
        void fromDraft() {
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            when(userRepo.findByUsername("alice")).thenReturn(Optional.of(alice));

            service.submit(1L, "alice");

            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeRequestStatus.SUBMITTED);
            assertThat(cap.getValue().getSubmittedBy()).isEqualTo("alice");
            assertThat(cap.getValue().getSubmittedAt()).isNotNull();
        }

        @Test @DisplayName("REJECTED can be resubmitted")
        void fromRejected() {
            draft.setStatus(ChangeRequestStatus.REJECTED);
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            when(userRepo.findByUsername("alice")).thenReturn(Optional.empty());

            service.submit(1L, "alice");

            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeRequestStatus.SUBMITTED);
        }

        @Test @DisplayName("wrong status throws IllegalStateException")
        void wrongStatus() {
            draft.setStatus(ChangeRequestStatus.APPROVED);
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            assertThatThrownBy(() -> service.submit(1L, "alice"))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── startReview ────────────────────────────────────────────────────────────

    @Nested @DisplayName("startReview")
    class StartReview {

        @Test @DisplayName("SUBMITTED → IN_REVIEW")
        void happy() {
            draft.setStatus(ChangeRequestStatus.SUBMITTED);
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));

            service.startReview(1L, "bob");

            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeRequestStatus.IN_REVIEW);
            assertThat(cap.getValue().getReviewedBy()).isEqualTo("bob");
        }

        @Test @DisplayName("DRAFT status rejected")
        void wrongStatus() {
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            assertThatThrownBy(() -> service.startReview(1L, "bob"))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── approve ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("approve")
    class Approve {

        @BeforeEach
        void inReview() {
            draft.setStatus(ChangeRequestStatus.IN_REVIEW);
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            when(changeNoticeRepo.count()).thenReturn(0L);
            when(userRepo.findByUsername(anyString())).thenReturn(Optional.empty());
        }

        @Test @DisplayName("IN_REVIEW → APPROVED, creates ECN, no parts")
        void noPartsCreatesEcn() {
            service.approve(1L, "bob", "Looks good");

            ArgumentCaptor<ChangeRequest> crCap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo, atLeast(2)).save(crCap.capture());
            ChangeRequest last = crCap.getAllValues().get(crCap.getAllValues().size() - 1);
            assertThat(last.getStatus()).isEqualTo(ChangeRequestStatus.APPROVED);

            ArgumentCaptor<ChangeNotice> ecnCap = ArgumentCaptor.forClass(ChangeNotice.class);
            verify(changeNoticeRepo).save(ecnCap.capture());
            assertThat(ecnCap.getValue().getNoticeNumber()).isEqualTo("ECN-0001");
            assertThat(ecnCap.getValue().getStatus()).isEqualTo(ChangeNoticeStatus.OPEN);
        }

        @Test @DisplayName("impacted parts get auto-revised and ChangeOrderItems created")
        void autoRevisesParts() {
            draft.setImpactedPartIds("5,6");

            Part orig5 = partWithId(5L, "A", 1);
            Part rev5  = partWithId(55L, "B", 1);
            Part orig6 = partWithId(6L, "A", 1);
            Part rev6  = partWithId(66L, "B", 1);

            when(partService.getPart(5L)).thenReturn(orig5);
            when(partService.revise(5L)).thenReturn(rev5);
            when(partService.getPart(6L)).thenReturn(orig6);
            when(partService.revise(6L)).thenReturn(rev6);
            when(changeOrderItemRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.approve(1L, "bob", "OK");

            verify(changeOrderItemRepo, times(2)).save(any());
        }

        @Test @DisplayName("part revision failure is swallowed — ECN still created")
        void partRevisionFails() {
            draft.setImpactedPartIds("7");
            when(partService.getPart(7L)).thenThrow(new RuntimeException("Part gone"));

            assertThatCode(() -> service.approve(1L, "bob", "OK")).doesNotThrowAnyException();
            verify(changeNoticeRepo).save(any());
        }

        @Test @DisplayName("DRAFT status rejected")
        void wrongStatus() {
            draft.setStatus(ChangeRequestStatus.DRAFT);
            assertThatThrownBy(() -> service.approve(1L, "bob", "OK"))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── reject ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("reject")
    class Reject {

        @Test @DisplayName("IN_REVIEW → REJECTED, notifies creator")
        void happy() {
            draft.setStatus(ChangeRequestStatus.IN_REVIEW);
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            when(userRepo.findByUsername("alice")).thenReturn(Optional.of(alice));

            service.reject(1L, "bob", "Not justified");

            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeRequestStatus.REJECTED);
            assertThat(cap.getValue().getResolutionComment()).isEqualTo("Not justified");
            verify(notificationService).create(eq(99L), anyString(), anyString(), any(), any(), any(), any());
        }

        @Test @DisplayName("DRAFT status rejected")
        void wrongStatus() {
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            assertThatThrownBy(() -> service.reject(1L, "bob", "No"))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── close ──────────────────────────────────────────────────────────────────

    @Nested @DisplayName("close")
    class Close {

        @Test @DisplayName("APPROVED → CLOSED")
        void fromApproved() {
            draft.setStatus(ChangeRequestStatus.APPROVED);
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            service.close(1L, "alice");
            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeRequestStatus.CLOSED);
            assertThat(cap.getValue().getClosedBy()).isEqualTo("alice");
        }

        @Test @DisplayName("REJECTED → CLOSED also allowed")
        void fromRejected() {
            draft.setStatus(ChangeRequestStatus.REJECTED);
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            service.close(1L, "alice");
            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeRequestStatus.CLOSED);
        }

        @Test @DisplayName("DRAFT status rejected")
        void wrongStatus() {
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            assertThatThrownBy(() -> service.close(1L, "alice"))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── reopen ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("reopen")
    class Reopen {

        @Test @DisplayName("REJECTED → DRAFT, clears resolution fields")
        void happy() {
            draft.setStatus(ChangeRequestStatus.REJECTED);
            draft.setResolutionComment("Old reason");
            draft.setReviewedBy("bob");
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));

            service.reopen(1L, "alice");

            ArgumentCaptor<ChangeRequest> cap = ArgumentCaptor.forClass(ChangeRequest.class);
            verify(changeRequestRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeRequestStatus.DRAFT);
            assertThat(cap.getValue().getResolutionComment()).isNull();
            assertThat(cap.getValue().getReviewedBy()).isNull();
        }

        @Test @DisplayName("CLOSED cannot be reopened")
        void wrongStatus() {
            draft.setStatus(ChangeRequestStatus.CLOSED);
            when(changeRequestRepo.findById(1L)).thenReturn(Optional.of(draft));
            assertThatThrownBy(() -> service.reopen(1L, "alice"))
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── releaseNotice ──────────────────────────────────────────────────────────

    @Nested @DisplayName("releaseNotice")
    class ReleaseNotice {

        private ChangeNotice openNotice;

        @BeforeEach
        void build() {
            openNotice = new ChangeNotice();
            openNotice.setId(50L);
            openNotice.setNoticeNumber("ECN-0001");
            openNotice.setStatus(ChangeNoticeStatus.OPEN);
        }

        @Test @DisplayName("OPEN → RELEASED, sets releasedBy + timestamp")
        void happy() {
            when(changeNoticeRepo.findById(50L)).thenReturn(Optional.of(openNotice));
            service.releaseNotice(50L, "alice");
            ArgumentCaptor<ChangeNotice> cap = ArgumentCaptor.forClass(ChangeNotice.class);
            verify(changeNoticeRepo).save(cap.capture());
            assertThat(cap.getValue().getStatus()).isEqualTo(ChangeNoticeStatus.RELEASED);
            assertThat(cap.getValue().getReleasedBy()).isEqualTo("alice");
            assertThat(cap.getValue().getReleasedAt()).isNotNull();
        }

        @Test @DisplayName("already RELEASED throws IllegalStateException")
        void alreadyReleased() {
            openNotice.setStatus(ChangeNoticeStatus.RELEASED);
            when(changeNoticeRepo.findById(50L)).thenReturn(Optional.of(openNotice));
            assertThatThrownBy(() -> service.releaseNotice(50L, "alice"))
                .isInstanceOf(IllegalStateException.class);
        }

        @Test @DisplayName("missing notice throws IllegalArgumentException")
        void missing() {
            when(changeNoticeRepo.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.releaseNotice(99L, "alice"))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private static Part partWithId(Long id, String revision, int iteration) {
        Part p = new Part();
        p.setId(id);
        p.setPartNumber("PN-" + id);
        p.setRevision(revision);
        p.setIteration(iteration);
        return p;
    }
}
