package com.windchill.api.change;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.windchill.common.exception.BusinessException;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.service.change.ChangeOrderCreateRequest;
import com.windchill.service.change.ChangeOrderDto;
import com.windchill.service.change.IChangeOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChangeOrderController.class)
class ChangeOrderControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @MockBean  IChangeOrderService service;

    private ChangeOrderDto sampleDto;

    @BeforeEach
    void setUp() {
        sampleDto = ChangeOrderDto.builder()
            .id(1L).ecoNumber("ECO-00001").title("Test ECO")
            .state("DRAFT").priority("MEDIUM").contextId(10L)
            .createdBy("alice").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
            .build();
    }

    // ─── GET /context/{contextId} ─────────────────────────────────────────

    @Nested @DisplayName("GET /context/{contextId}")
    class ListByContext {

        @Test @WithMockUser @DisplayName("200 with list for authenticated user")
        void authenticated() throws Exception {
            when(service.listByContext(10L)).thenReturn(List.of(sampleDto));

            mockMvc.perform(get("/api/v1/plm/changes/eco/context/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ecoNumber").value("ECO-00001"));
        }

        @Test @DisplayName("401 when unauthenticated")
        void unauthenticated() throws Exception {
            mockMvc.perform(get("/api/v1/plm/changes/eco/context/10"))
                .andExpect(status().isUnauthorized());
        }
    }

    // ─── GET /{id} ────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /{id}")
    class GetById {

        @Test @WithMockUser @DisplayName("200 when found")
        void found() throws Exception {
            when(service.getById(1L)).thenReturn(sampleDto);

            mockMvc.perform(get("/api/v1/plm/changes/eco/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
        }

        @Test @WithMockUser @DisplayName("404 when missing")
        void notFound() throws Exception {
            when(service.getById(99L)).thenThrow(new ResourceNotFoundException("ChangeOrder not found"));

            mockMvc.perform(get("/api/v1/plm/changes/eco/99"))
                .andExpect(status().isNotFound());
        }
    }

    // ─── POST / ──────────────────────────────────────────────────────────

    @Nested @DisplayName("POST /")
    class Create {

        @Test @WithMockUser(username = "alice") @DisplayName("201 on valid request")
        void created() throws Exception {
            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setContextId(10L);
            req.setTitle("My ECO");

            when(service.create(any(), eq("alice"))).thenReturn(sampleDto);

            mockMvc.perform(post("/api/v1/plm/changes/eco")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ecoNumber").value("ECO-00001"));
        }

        @Test @WithMockUser @DisplayName("400 when title is blank")
        void blankTitle() throws Exception {
            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setContextId(10L);
            req.setTitle("");

            mockMvc.perform(post("/api/v1/plm/changes/eco")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
        }

        @Test @WithMockUser @DisplayName("400 when contextId is null")
        void nullContextId() throws Exception {
            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setTitle("Valid title");

            mockMvc.perform(post("/api/v1/plm/changes/eco")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("401 when unauthenticated")
        void unauthenticated() throws Exception {
            mockMvc.perform(post("/api/v1/plm/changes/eco")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isUnauthorized());
        }
    }

    // ─── POST /{id}/promote ───────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/promote")
    class Promote {

        @Test @WithMockUser(username = "alice") @DisplayName("200 on valid transition")
        void validTransition() throws Exception {
            when(service.promote(1L, "OPEN", "alice")).thenReturn(
                sampleDto.toBuilder().state("OPEN").build());

            mockMvc.perform(post("/api/v1/plm/changes/eco/1/promote")
                    .with(csrf())
                    .param("targetState", "OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("OPEN"));
        }

        @Test @WithMockUser(username = "charlie") @DisplayName("409 when service rejects unauthorized promote")
        void unauthorized() throws Exception {
            when(service.promote(1L, "OPEN", "charlie"))
                .thenThrow(new BusinessException("Not authorized to promote ECO ECO-00001"));

            mockMvc.perform(post("/api/v1/plm/changes/eco/1/promote")
                    .with(csrf())
                    .param("targetState", "OPEN"))
                .andExpect(status().isConflict());
        }
    }

    // ─── POST /{id}/ai-result ─────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/ai-result")
    class LinkAiResult {

        @Test @WithMockUser(username = "system") @DisplayName("200 stores AI scores")
        void storesScores() throws Exception {
            when(service.linkAiResult(eq(1L), eq(7.5), eq(0.9), eq(12000.0), eq("system")))
                .thenReturn(sampleDto.toBuilder().aiRiskScore(7.5).build());

            mockMvc.perform(post("/api/v1/plm/changes/eco/1/ai-result")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(
                        Map.of("riskScore", 7.5, "confidence", 0.9, "costEstimate", 12000.0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiRiskScore").value(7.5));
        }

        @Test @DisplayName("401 when unauthenticated")
        void unauthenticated() throws Exception {
            mockMvc.perform(post("/api/v1/plm/changes/eco/1/ai-result")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isUnauthorized());
        }
    }

    // ─── DELETE /{id} ─────────────────────────────────────────────────────

    @Nested @DisplayName("DELETE /{id}")
    class Delete {

        @Test @WithMockUser(username = "alice") @DisplayName("204 on successful delete")
        void deleted() throws Exception {
            doNothing().when(service).delete(1L, "alice");

            mockMvc.perform(delete("/api/v1/plm/changes/eco/1").with(csrf()))
                .andExpect(status().isNoContent());
        }

        @Test @WithMockUser(username = "charlie") @DisplayName("409 when service rejects non-owner delete")
        void nonOwnerRejected() throws Exception {
            doThrow(new BusinessException("Not authorized to delete ECO ECO-00001"))
                .when(service).delete(1L, "charlie");

            mockMvc.perform(delete("/api/v1/plm/changes/eco/1").with(csrf()))
                .andExpect(status().isConflict());
        }

        @Test @DisplayName("401 when unauthenticated")
        void unauthenticated() throws Exception {
            mockMvc.perform(delete("/api/v1/plm/changes/eco/1").with(csrf()))
                .andExpect(status().isUnauthorized());
        }
    }
}
