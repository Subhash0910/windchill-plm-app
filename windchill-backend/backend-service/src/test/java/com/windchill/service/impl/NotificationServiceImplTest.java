package com.windchill.service.impl;

import com.windchill.domain.entity.Notification;
import com.windchill.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock NotificationRepository repo;
    @InjectMocks NotificationServiceImpl service;

    private static final Long USER_ID = 42L;
    private static final Long NOTIF_ID = 1L;

    private Notification saved;

    @BeforeEach
    void setUp() {
        saved = Notification.builder()
            .userId(USER_ID).title("Part approved").message("P001 is RELEASED")
            .type("PART_PROMOTED").entityType("PART").entityId(5L).entityNumber("P001")
            .read(false).createdAt(LocalDateTime.now())
            .build();
        saved = setId(saved, NOTIF_ID);
    }

    // ── create ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("create")
    class Create {

        @Test @DisplayName("persists all fields and returns saved entity")
        void allFields() {
            when(repo.save(any())).thenReturn(saved);

            Notification result = service.create(USER_ID, "Part approved", "P001 is RELEASED",
                "PART_PROMOTED", "PART", 5L, "P001");

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(repo).save(cap.capture());
            Notification n = cap.getValue();

            assertThat(n.getUserId()).isEqualTo(USER_ID);
            assertThat(n.getTitle()).isEqualTo("Part approved");
            assertThat(n.getMessage()).isEqualTo("P001 is RELEASED");
            assertThat(n.getType()).isEqualTo("PART_PROMOTED");
            assertThat(n.getEntityType()).isEqualTo("PART");
            assertThat(n.getEntityId()).isEqualTo(5L);
            assertThat(n.getEntityNumber()).isEqualTo("P001");
            assertThat(n.isRead()).isFalse();
            assertThat(result.getId()).isEqualTo(NOTIF_ID);
        }

        @Test @DisplayName("defaults type to INFO when null")
        void nullTypeDefaultsToInfo() {
            Notification infoSaved = Notification.builder()
                .userId(USER_ID).title("T").message("M").type("INFO")
                .read(false).createdAt(LocalDateTime.now()).build();
            when(repo.save(any())).thenReturn(infoSaved);

            service.create(USER_ID, "T", "M", null, null, null, null);

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(repo).save(cap.capture());
            // service converts null → "INFO" in the builder call itself
            assertThat(cap.getValue().getType()).isEqualTo("INFO");
        }

        @Test @DisplayName("allows null entityId and entityNumber (system notifications)")
        void nullEntityFields() {
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.create(USER_ID, "System alert", "Maintenance window", "SYSTEM", null, null, null);

            ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
            verify(repo).save(cap.capture());
            assertThat(cap.getValue().getEntityId()).isNull();
            assertThat(cap.getValue().getEntityNumber()).isNull();
        }
    }

    // ── read ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("getUnread")
    class GetUnread {

        @Test @DisplayName("delegates to repo and returns list")
        void delegates() {
            when(repo.findByUserIdAndReadFalseOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(saved));

            List<Notification> result = service.getUnread(USER_ID);

            assertThat(result).hasSize(1).contains(saved);
        }

        @Test @DisplayName("returns empty list when no unread")
        void empty() {
            when(repo.findByUserIdAndReadFalseOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of());

            assertThat(service.getUnread(USER_ID)).isEmpty();
        }
    }

    @Nested @DisplayName("getAll")
    class GetAll {

        @Test @DisplayName("delegates to repo ordered by createdAt desc")
        void delegates() {
            when(repo.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(saved));

            assertThat(service.getAll(USER_ID)).containsExactly(saved);
        }
    }

    @Nested @DisplayName("getUnreadCount")
    class GetUnreadCount {

        @Test @DisplayName("returns count from repo")
        void returnsCount() {
            when(repo.countByUserIdAndReadFalse(USER_ID)).thenReturn(7L);

            assertThat(service.getUnreadCount(USER_ID)).isEqualTo(7L);
        }

        @Test @DisplayName("returns 0 when none unread")
        void zero() {
            when(repo.countByUserIdAndReadFalse(USER_ID)).thenReturn(0L);

            assertThat(service.getUnreadCount(USER_ID)).isZero();
        }
    }

    // ── write ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("markAsRead")
    class MarkAsRead {

        @Test @DisplayName("calls repo with id, userId, and a non-null timestamp")
        void callsRepo() {
            service.markAsRead(NOTIF_ID, USER_ID);

            verify(repo).markAsRead(eq(NOTIF_ID), eq(USER_ID), any(LocalDateTime.class));
        }
    }

    @Nested @DisplayName("markAllAsRead")
    class MarkAllAsRead {

        @Test @DisplayName("calls repo with userId and a non-null timestamp")
        void callsRepo() {
            service.markAllAsRead(USER_ID);

            verify(repo).markAllAsRead(eq(USER_ID), any(LocalDateTime.class));
        }
    }

    @Nested @DisplayName("delete")
    class Delete {

        @Test @DisplayName("calls deleteByIdAndUserId — enforces ownership")
        void callsRepo() {
            service.delete(NOTIF_ID, USER_ID);

            verify(repo).deleteByIdAndUserId(NOTIF_ID, USER_ID);
        }

        @Test @DisplayName("wrong userId silently no-ops (repo handles ownership)")
        void wrongUser() {
            service.delete(NOTIF_ID, 999L);

            verify(repo).deleteByIdAndUserId(NOTIF_ID, 999L);
        }
    }

    // ── helper ─────────────────────────────────────────────────────────────

    private static Notification setId(Notification n, Long id) {
        n.setId(id);
        return n;
    }
}
