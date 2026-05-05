package com.windchill.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.windchill.api.exception.GlobalExceptionHandler;
import com.windchill.common.enums.WorkItemStatusEnum;
import com.windchill.common.exception.BusinessException;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.PromotionRequest;
import com.windchill.domain.entity.WorkItem;
import com.windchill.repository.PromotionRequestRepository;
import com.windchill.service.INotificationService;
import com.windchill.service.plm.IPartService;
import com.windchill.service.workflow.PromotionWorkflowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class WorkItemControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Mock PromotionWorkflowService workflow;
    @Mock IPartService             partService;
    @Mock INotificationService     notificationService;
    @Mock PromotionRequestRepository promotionRequestRepo;
    @InjectMocks WorkItemController controller;

    private static final String BASE = "/api/v1/plm/workitems";

    private WorkItem pendingItem;
    private Part     part;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        part = new Part();
        part.setPartNumber("P001");
        part.setName("Engine Block");

        pendingItem = new WorkItem();
        pendingItem.setId(1L);
        pendingItem.setPromotionRequestId(10L);
        pendingItem.setContextId(5L);
        pendingItem.setPartId(7L);
        pendingItem.setAssigneeUserId(42L);
        pendingItem.setStatus(WorkItemStatusEnum.PENDING);
        pendingItem.setDueAt(LocalDateTime.now().plusDays(3));
    }

    // ── GET /my ────────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /my")
    class My {

        @Test @DisplayName("200 returns pending work items with part info")
        void withPart() throws Exception {
            when(workflow.myPendingWorkItems()).thenReturn(List.of(pendingItem));
            when(partService.getPart(7L)).thenReturn(part);

            mockMvc.perform(get(BASE + "/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].partNumber").value("P001"))
                .andExpect(jsonPath("$.data[0].partName").value("Engine Block"))
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
        }

        @Test @DisplayName("200 returns item with null part fields when part not found")
        void partMissing() throws Exception {
            when(workflow.myPendingWorkItems()).thenReturn(List.of(pendingItem));
            when(partService.getPart(7L)).thenThrow(new RuntimeException("not found"));

            mockMvc.perform(get(BASE + "/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].partNumber").doesNotExist())
                .andExpect(jsonPath("$.data[0].id").value(1));
        }

        @Test @DisplayName("200 empty list when no pending items")
        void empty() throws Exception {
            when(workflow.myPendingWorkItems()).thenReturn(List.of());

            mockMvc.perform(get(BASE + "/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        }
    }

    // ── POST /{id}/approve ─────────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/approve")
    class Approve {

        @Test @DisplayName("200 approves and sends notification to requester")
        void withNotification() throws Exception {
            WorkItem approved = new WorkItem();
            approved.setId(1L); approved.setPromotionRequestId(10L);
            approved.setPartId(7L); approved.setStatus(WorkItemStatusEnum.APPROVED);
            approved.setContextId(5L); approved.setAssigneeUserId(42L);

            PromotionRequest pr = new PromotionRequest();
            pr.setRequestedByUserId(99L);

            when(workflow.approve(1L, "LGTM")).thenReturn(approved);
            when(partService.getPart(7L)).thenReturn(part);
            when(promotionRequestRepo.findById(10L)).thenReturn(Optional.of(pr));
            when(notificationService.create(anyLong(), anyString(), anyString(), anyString(),
                anyString(), anyLong(), anyString())).thenReturn(null);

            mockMvc.perform(post(BASE + "/1/approve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("comment", "LGTM"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

            verify(notificationService).create(eq(99L), contains("approved"), anyString(),
                eq("PART_PROMOTED"), eq("PART"), eq(7L), eq("P001"));
        }

        @Test @DisplayName("200 skips notification when no PromotionRequest found")
        void noPr() throws Exception {
            WorkItem approved = new WorkItem();
            approved.setId(1L); approved.setPromotionRequestId(10L);
            approved.setPartId(7L); approved.setStatus(WorkItemStatusEnum.APPROVED);
            approved.setContextId(5L); approved.setAssigneeUserId(42L);

            when(workflow.approve(1L, null)).thenReturn(approved);
            when(partService.getPart(7L)).thenReturn(part);
            when(promotionRequestRepo.findById(10L)).thenReturn(Optional.empty());

            mockMvc.perform(post(BASE + "/1/approve"))
                .andExpect(status().isOk());

            verify(notificationService, never()).create(any(), any(), any(), any(), any(), any(), any());
        }

        @Test @DisplayName("409 when workflow throws BusinessException")
        void conflict() throws Exception {
            when(workflow.approve(1L, null))
                .thenThrow(new BusinessException("Not your work item"));

            mockMvc.perform(post(BASE + "/1/approve"))
                .andExpect(status().isConflict());
        }
    }

    // ── POST /{id}/reject ──────────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/reject")
    class Reject {

        @Test @DisplayName("200 rejects and sends rejection notification with reason")
        void withReason() throws Exception {
            WorkItem rejected = new WorkItem();
            rejected.setId(1L); rejected.setPromotionRequestId(10L);
            rejected.setPartId(7L); rejected.setStatus(WorkItemStatusEnum.REJECTED);
            rejected.setContextId(5L); rejected.setAssigneeUserId(42L);

            PromotionRequest pr = new PromotionRequest();
            pr.setRequestedByUserId(99L);

            when(workflow.reject(1L, "Needs rework")).thenReturn(rejected);
            when(partService.getPart(7L)).thenReturn(part);
            when(promotionRequestRepo.findById(10L)).thenReturn(Optional.of(pr));
            when(notificationService.create(anyLong(), anyString(), anyString(), anyString(),
                anyString(), anyLong(), anyString())).thenReturn(null);

            mockMvc.perform(post(BASE + "/1/reject")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("comment", "Needs rework"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));

            verify(notificationService).create(eq(99L), contains("rejected"), contains("Needs rework"),
                eq("ECR_REJECTED"), eq("PART"), eq(7L), eq("P001"));
        }

        @Test @DisplayName("200 uses 'No reason given' when comment is blank")
        void blankComment() throws Exception {
            WorkItem rejected = new WorkItem();
            rejected.setId(1L); rejected.setPromotionRequestId(10L);
            rejected.setPartId(7L); rejected.setStatus(WorkItemStatusEnum.REJECTED);
            rejected.setContextId(5L); rejected.setAssigneeUserId(42L);

            PromotionRequest pr = new PromotionRequest();
            pr.setRequestedByUserId(99L);

            when(workflow.reject(1L, "")).thenReturn(rejected);
            when(partService.getPart(7L)).thenReturn(part);
            when(promotionRequestRepo.findById(10L)).thenReturn(Optional.of(pr));
            when(notificationService.create(anyLong(), anyString(), anyString(), anyString(),
                anyString(), anyLong(), anyString())).thenReturn(null);

            mockMvc.perform(post(BASE + "/1/reject")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("comment", ""))))
                .andExpect(status().isOk());

            verify(notificationService).create(anyLong(), anyString(), contains("No reason given"),
                anyString(), anyString(), anyLong(), anyString());
        }

        @Test @DisplayName("409 when workflow throws BusinessException")
        void conflict() throws Exception {
            when(workflow.reject(1L, null))
                .thenThrow(new BusinessException("Not your work item"));

            mockMvc.perform(post(BASE + "/1/reject"))
                .andExpect(status().isConflict());
        }
    }
}
