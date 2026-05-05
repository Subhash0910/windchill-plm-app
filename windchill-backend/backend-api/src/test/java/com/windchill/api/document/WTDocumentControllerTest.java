package com.windchill.api.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.windchill.api.exception.GlobalExceptionHandler;
import com.windchill.domain.entity.Part;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Standalone MockMvc — avoids the broad @ComponentScan("com.windchill") that loads
 * all 21 controllers. Sets Authentication via request.setUserPrincipal() so Spring
 * MVC's built-in PrincipalMethodArgumentResolver resolves it correctly.
 */
@ExtendWith(MockitoExtension.class)
class WTDocumentControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Mock  WTDocumentService service;
    @InjectMocks WTDocumentController controller;

    private static final String BASE = "/api/v1/plm/documents";
    private WTDocumentDto sampleDto;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        sampleDto = WTDocumentDto.builder()
            .id(1L).contextId(10L).docNumber("DOC-0001").name("Design Spec")
            .docType("SPEC").lifecycleState("INWORK").revision("A").iteration(1)
            .isLatest(true).versionLabel("A.1").createdBy("alice")
            .build();
    }

    /** Sets request.setUserPrincipal so Spring MVC injects it as Authentication. */
    private static RequestPostProcessor as(String username) {
        var auth = new UsernamePasswordAuthenticationToken(username, null, List.of());
        return (MockHttpServletRequest req) -> { req.setUserPrincipal(auth); return req; };
    }

    // ── GET / ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /")
    class List_ {

        @Test @DisplayName("200 with list")
        void list() throws Exception {
            when(service.listByContext(10L, null)).thenReturn(List.of(sampleDto));

            mockMvc.perform(get(BASE).param("contextId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].docNumber").value("DOC-0001"));
        }

        @Test @DisplayName("200 passes docType filter to service")
        void withDocType() throws Exception {
            when(service.listByContext(10L, "DRAWING")).thenReturn(List.of());

            mockMvc.perform(get(BASE).param("contextId", "10").param("docType", "DRAWING"))
                .andExpect(status().isOk());

            verify(service).listByContext(10L, "DRAWING");
        }
    }

    // ── GET /{id} ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /{id}")
    class GetById {

        @Test @DisplayName("200 returns DTO")
        void found() throws Exception {
            when(service.getById(1L)).thenReturn(sampleDto);

            mockMvc.perform(get(BASE + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.versionLabel").value("A.1"));
        }

        @Test @DisplayName("500 on EntityNotFoundException")
        void notFound() throws Exception {
            when(service.getById(99L)).thenThrow(new EntityNotFoundException("Document not found: 99"));

            mockMvc.perform(get(BASE + "/99"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false));
        }
    }

    // ── POST / ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("POST /")
    class Create {

        @Test @DisplayName("201 on valid request — delegates username from auth")
        void created() throws Exception {
            WTDocumentCreateRequest req = new WTDocumentCreateRequest();
            req.setContextId(10L); req.setDocNumber("DOC-0001"); req.setName("Design Spec");

            when(service.create(any(), eq("alice"))).thenReturn(sampleDto);

            mockMvc.perform(post(BASE).with(as("alice"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.docNumber").value("DOC-0001"));
        }
    }

    // ── PUT /{id} ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("PUT /{id}")
    class UpdateDoc {

        @Test @DisplayName("200 on valid update")
        void updated() throws Exception {
            WTDocumentUpdateRequest req = new WTDocumentUpdateRequest();
            req.setName("Updated Spec");

            WTDocumentDto updated = sampleDto.toBuilder().name("Updated Spec").build();
            when(service.update(eq(1L), any(), eq("alice"))).thenReturn(updated);

            mockMvc.perform(put(BASE + "/1").with(as("alice"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Spec"));
        }

        @Test @DisplayName("500 when checked out by another user")
        void checkoutConflict() throws Exception {
            WTDocumentUpdateRequest req = new WTDocumentUpdateRequest();
            req.setName("Sneaky");

            when(service.update(eq(1L), any(), eq("bob")))
                .thenThrow(new IllegalStateException("Document is checked out by alice"));

            mockMvc.perform(put(BASE + "/1").with(as("bob"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isInternalServerError());
        }
    }

    // ── POST /{id}/promote ────────────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/promote")
    class Promote {

        @Test @DisplayName("200 returns promoted DTO")
        void ok() throws Exception {
            WTDocumentDto promoted = sampleDto.toBuilder().lifecycleState("RELEASED").build();
            when(service.promote(1L, "RELEASED", "alice")).thenReturn(promoted);

            mockMvc.perform(post(BASE + "/1/promote").with(as("alice")).param("target", "RELEASED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lifecycleState").value("RELEASED"));
        }

        @Test @DisplayName("500 when document is checked out")
        void checkedOut() throws Exception {
            when(service.promote(1L, "RELEASED", "alice"))
                .thenThrow(new IllegalStateException("Cannot promote a checked-out document."));

            mockMvc.perform(post(BASE + "/1/promote").with(as("alice")).param("target", "RELEASED"))
                .andExpect(status().isInternalServerError());
        }
    }

    // ── POST /{id}/checkout ───────────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/checkout")
    class CheckOut {

        @Test @DisplayName("200 returns working copy")
        void ok() throws Exception {
            WTDocumentDto working = sampleDto.toBuilder().iteration(2).checkedOutBy("alice").build();
            when(service.checkOut(1L, "alice")).thenReturn(working);

            mockMvc.perform(post(BASE + "/1/checkout").with(as("alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkedOutBy").value("alice"))
                .andExpect(jsonPath("$.data.iteration").value(2));
        }

        @Test @DisplayName("500 when already checked out")
        void alreadyCheckedOut() throws Exception {
            when(service.checkOut(1L, "bob"))
                .thenThrow(new IllegalStateException("Already checked out by alice"));

            mockMvc.perform(post(BASE + "/1/checkout").with(as("bob")))
                .andExpect(status().isInternalServerError());
        }
    }

    // ── POST /{id}/checkin ────────────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/checkin")
    class CheckIn {

        @Test @DisplayName("200 clears checkout")
        void ok() throws Exception {
            WTDocumentDto cleared = sampleDto.toBuilder().checkedOutBy(null).build();
            when(service.checkIn(1L, "alice")).thenReturn(cleared);

            mockMvc.perform(post(BASE + "/1/checkin").with(as("alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        }

        @Test @DisplayName("500 when non-owner attempts check-in")
        void nonOwner() throws Exception {
            when(service.checkIn(1L, "bob"))
                .thenThrow(new IllegalStateException("Only the checkout owner can check in."));

            mockMvc.perform(post(BASE + "/1/checkin").with(as("bob")))
                .andExpect(status().isInternalServerError());
        }
    }

    // ── POST /{id}/undo-checkout ──────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/undo-checkout")
    class UndoCheckOut {

        @Test @DisplayName("200 returns restored DTO")
        void ok() throws Exception {
            when(service.undoCheckOut(1L, "alice")).thenReturn(sampleDto);

            mockMvc.perform(post(BASE + "/1/undo-checkout").with(as("alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.iteration").value(1));
        }

        @Test @DisplayName("500 when non-owner attempts undo")
        void nonOwner() throws Exception {
            when(service.undoCheckOut(1L, "bob"))
                .thenThrow(new IllegalStateException("Only the checkout owner can undo."));

            mockMvc.perform(post(BASE + "/1/undo-checkout").with(as("bob")))
                .andExpect(status().isInternalServerError());
        }
    }

    // ── DELETE /{id} ──────────────────────────────────────────────────────────

    @Nested @DisplayName("DELETE /{id}")
    class Delete {

        @Test @DisplayName("200 with 'Deleted successfully'")
        void deleted() throws Exception {
            doNothing().when(service).delete(1L, "alice");

            mockMvc.perform(delete(BASE + "/1").with(as("alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted successfully"));
        }

        @Test @DisplayName("500 on EntityNotFoundException")
        void notFound() throws Exception {
            doThrow(new EntityNotFoundException("not found")).when(service).delete(99L, "alice");

            mockMvc.perform(delete(BASE + "/99").with(as("alice")))
                .andExpect(status().isInternalServerError());
        }
    }

    // ── GET /by-part/{partId} ─────────────────────────────────────────────────

    @Nested @DisplayName("GET /by-part/{partId}")
    class ByPart {

        @Test @DisplayName("200 returns docs linked to part")
        void found() throws Exception {
            when(service.listByPart(5L)).thenReturn(List.of(sampleDto));

            mockMvc.perform(get(BASE + "/by-part/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].docNumber").value("DOC-0001"));
        }

        @Test @DisplayName("200 empty list when no docs")
        void empty() throws Exception {
            when(service.listByPart(5L)).thenReturn(List.of());

            mockMvc.perform(get(BASE + "/by-part/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        }
    }

    // ── GET /by-doc/{docId} ───────────────────────────────────────────────────

    @Nested @DisplayName("GET /by-doc/{docId}")
    class ByDoc {

        @Test @DisplayName("200 returns related parts array")
        void found() throws Exception {
            Part part = new Part(); part.setPartNumber("PART-001");
            when(service.listRelatedParts(1L)).thenReturn(List.of(part));

            mockMvc.perform(get(BASE + "/by-doc/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        }
    }

    // ── POST /{id}/link-part/{partId} ─────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/link-part/{partId}")
    class LinkPart {

        @Test @DisplayName("200 on link")
        void linked() throws Exception {
            doNothing().when(service).linkToPart(1L, 5L);

            mockMvc.perform(post(BASE + "/1/link-part/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

            verify(service).linkToPart(1L, 5L);
        }
    }

    // ── DELETE /{id}/link-part/{partId} ──────────────────────────────────────

    @Nested @DisplayName("DELETE /{id}/link-part/{partId}")
    class UnlinkPart {

        @Test @DisplayName("200 on unlink")
        void unlinked() throws Exception {
            doNothing().when(service).unlinkFromPart(1L, 5L);

            mockMvc.perform(delete(BASE + "/1/link-part/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

            verify(service).unlinkFromPart(1L, 5L);
        }
    }
}
