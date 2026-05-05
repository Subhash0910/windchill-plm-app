package com.windchill.api.controller;

import com.windchill.api.exception.GlobalExceptionHandler;
import com.windchill.api.security.AuthenticatedUser;
import com.windchill.common.enums.RoleEnum;
import com.windchill.domain.entity.Notification;
import com.windchill.service.INotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Standalone MockMvc. NotificationController resolves principals via
 * @AuthenticationPrincipal, which reads from SecurityContextHolder.
 * We register AuthenticationPrincipalArgumentResolver and set the context
 * manually in each test via setContext().
 */
@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    private MockMvc mockMvc;

    @Mock INotificationService service;
    @InjectMocks NotificationController controller;

    private static final String BASE = "/api/v1/notifications";
    private static final Long USER_ID = 42L;

    private Notification sample;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();

        sample = Notification.builder()
            .userId(USER_ID).title("Part approved").message("P001 released")
            .type("PART_PROMOTED").entityType("PART").entityId(5L).entityNumber("P001")
            .read(false).createdAt(LocalDateTime.now())
            .build();
        sample.setId(1L);

        // seed SecurityContext with AuthenticatedUser as principal
        AuthenticatedUser principal = new AuthenticatedUser(USER_ID, "alice", RoleEnum.ENGINEER);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── GET /count ─────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /count")
    class Count {

        @Test @DisplayName("200 returns unreadCount")
        void ok() throws Exception {
            when(service.getUnreadCount(USER_ID)).thenReturn(3L);

            mockMvc.perform(get(BASE + "/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(3));
        }

        @Test @DisplayName("200 returns 0 when no unread")
        void zero() throws Exception {
            when(service.getUnreadCount(USER_ID)).thenReturn(0L);

            mockMvc.perform(get(BASE + "/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));
        }
    }

    // ── GET /unread ────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /unread")
    class Unread {

        @Test @DisplayName("200 returns list of unread notifications")
        void ok() throws Exception {
            when(service.getUnread(USER_ID)).thenReturn(List.of(sample));

            mockMvc.perform(get(BASE + "/unread"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Part approved"))
                .andExpect(jsonPath("$.data[0].entityNumber").value("P001"));
        }

        @Test @DisplayName("200 empty array when inbox clear")
        void empty() throws Exception {
            when(service.getUnread(USER_ID)).thenReturn(List.of());

            mockMvc.perform(get(BASE + "/unread"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        }
    }

    // ── GET / ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /")
    class GetAll {

        @Test @DisplayName("200 returns all notifications")
        void ok() throws Exception {
            Notification read = Notification.builder()
                .userId(USER_ID).title("Old").message("m").type("INFO")
                .read(true).createdAt(LocalDateTime.now().minusDays(1)).build();
            read.setId(2L);

            when(service.getAll(USER_ID)).thenReturn(List.of(sample, read));

            mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
        }
    }

    // ── PUT /{id}/read ─────────────────────────────────────────────────────

    @Nested @DisplayName("PUT /{id}/read")
    class MarkRead {

        @Test @DisplayName("200 marks notification as read")
        void ok() throws Exception {
            doNothing().when(service).markAsRead(1L, USER_ID);

            mockMvc.perform(put(BASE + "/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

            verify(service).markAsRead(1L, USER_ID);
        }
    }

    // ── PUT /read-all ──────────────────────────────────────────────────────

    @Nested @DisplayName("PUT /read-all")
    class MarkAllRead {

        @Test @DisplayName("200 marks all as read")
        void ok() throws Exception {
            doNothing().when(service).markAllAsRead(USER_ID);

            mockMvc.perform(put(BASE + "/read-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

            verify(service).markAllAsRead(USER_ID);
        }
    }

    // ── DELETE /{id} ───────────────────────────────────────────────────────

    @Nested @DisplayName("DELETE /{id}")
    class Delete {

        @Test @DisplayName("200 deletes notification")
        void ok() throws Exception {
            doNothing().when(service).delete(1L, USER_ID);

            mockMvc.perform(delete(BASE + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

            verify(service).delete(1L, USER_ID);
        }
    }
}
