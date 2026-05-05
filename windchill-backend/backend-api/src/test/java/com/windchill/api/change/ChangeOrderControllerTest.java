package com.windchill.api.change;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.windchill.api.exception.GlobalExceptionHandler;
import com.windchill.common.exception.BusinessException;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.service.change.ChangeOrderCreateRequest;
import com.windchill.service.change.ChangeOrderDto;
import com.windchill.service.change.IChangeOrderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Standalone MockMvc — avoids @WebMvcTest loading all 21 controllers via
 * @ComponentScan("com.windchill") which requires a JPA EntityManagerFactory.
 * Auth via SecurityContextHolder + AuthenticationPrincipalArgumentResolver.
 */
@ExtendWith(MockitoExtension.class)
class ChangeOrderControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Mock  IChangeOrderService service;
    @InjectMocks ChangeOrderController controller;

    private static final String BASE = "/api/v1/plm/changes/eco";
    private ChangeOrderDto sampleDto;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();

        sampleDto = ChangeOrderDto.builder()
            .id(1L).ecoNumber("ECO-00001").title("Test ECO")
            .state("DRAFT").priority("MEDIUM").contextId(10L)
            .createdBy("alice").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
            .build();

        asUser("alice");
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    private static void asUser(String username) {
        UserDetails ud = User.withUsername(username).password("x").roles("USER").build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities()));
    }

    // ─── GET /context/{contextId} ─────────────────────────────────────────

    @Nested @DisplayName("GET /context/{contextId}")
    class ListByContext {

        @Test @DisplayName("200 with list")
        void authenticated() throws Exception {
            when(service.listByContext(10L)).thenReturn(List.of(sampleDto));

            mockMvc.perform(get(BASE + "/context/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ecoNumber").value("ECO-00001"));
        }

        @Test @DisplayName("200 empty list for unknown context")
        void empty() throws Exception {
            when(service.listByContext(99L)).thenReturn(List.of());

            mockMvc.perform(get(BASE + "/context/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        }
    }

    // ─── GET /{id} ────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /{id}")
    class GetById {

        @Test @DisplayName("200 when found")
        void found() throws Exception {
            when(service.getById(1L)).thenReturn(sampleDto);

            mockMvc.perform(get(BASE + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
        }

        @Test @DisplayName("404 when missing")
        void notFound() throws Exception {
            when(service.getById(99L)).thenThrow(new ResourceNotFoundException("ChangeOrder not found"));

            mockMvc.perform(get(BASE + "/99"))
                .andExpect(status().isNotFound());
        }
    }

    // ─── POST / ──────────────────────────────────────────────────────────

    @Nested @DisplayName("POST /")
    class Create {

        @Test @DisplayName("201 on valid request — username from principal")
        void created() throws Exception {
            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setContextId(10L); req.setTitle("My ECO");

            when(service.create(any(), eq("alice"))).thenReturn(sampleDto);

            mockMvc.perform(post(BASE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ecoNumber").value("ECO-00001"));
        }

        @Test @DisplayName("400 when title is blank (@Valid)")
        void blankTitle() throws Exception {
            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setContextId(10L); req.setTitle("");

            mockMvc.perform(post(BASE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("400 when contextId is null (@Valid)")
        void nullContextId() throws Exception {
            ChangeOrderCreateRequest req = new ChangeOrderCreateRequest();
            req.setTitle("Valid title");

            mockMvc.perform(post(BASE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
        }
    }

    // ─── POST /{id}/promote ───────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/promote")
    class Promote {

        @Test @DisplayName("200 on valid transition")
        void validTransition() throws Exception {
            when(service.promote(1L, "OPEN", "alice"))
                .thenReturn(sampleDto.toBuilder().state("OPEN").build());

            mockMvc.perform(post(BASE + "/1/promote").param("targetState", "OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state").value("OPEN"));
        }

        @Test @DisplayName("409 when service rejects unauthorized promote")
        void unauthorized() throws Exception {
            asUser("charlie");
            when(service.promote(1L, "OPEN", "charlie"))
                .thenThrow(new BusinessException("Not authorized"));

            mockMvc.perform(post(BASE + "/1/promote").param("targetState", "OPEN"))
                .andExpect(status().isConflict());
        }
    }

    // ─── POST /{id}/ai-result ─────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/ai-result")
    class LinkAiResult {

        @Test @DisplayName("200 stores AI scores")
        void storesScores() throws Exception {
            when(service.linkAiResult(eq(1L), eq(7.5), eq(0.9), eq(12000.0), eq("alice")))
                .thenReturn(sampleDto.toBuilder().aiRiskScore(7.5).build());

            mockMvc.perform(post(BASE + "/1/ai-result")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(
                        Map.of("riskScore", 7.5, "confidence", 0.9, "costEstimate", 12000.0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiRiskScore").value(7.5));
        }
    }

    // ─── DELETE /{id} ─────────────────────────────────────────────────────

    @Nested @DisplayName("DELETE /{id}")
    class Delete {

        @Test @DisplayName("204 on successful delete")
        void deleted() throws Exception {
            doNothing().when(service).delete(1L, "alice");

            mockMvc.perform(delete(BASE + "/1"))
                .andExpect(status().isNoContent());
        }

        @Test @DisplayName("409 when service rejects non-owner delete")
        void nonOwnerRejected() throws Exception {
            asUser("charlie");
            doThrow(new BusinessException("Not authorized")).when(service).delete(1L, "charlie");

            mockMvc.perform(delete(BASE + "/1"))
                .andExpect(status().isConflict());
        }
    }
}
