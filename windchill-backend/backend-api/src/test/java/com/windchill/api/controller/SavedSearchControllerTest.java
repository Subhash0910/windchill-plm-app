package com.windchill.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.windchill.api.exception.GlobalExceptionHandler;
import com.windchill.common.security.CurrentUserProvider;
import com.windchill.domain.entity.SavedSearch;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.DocumentRepository;
import com.windchill.repository.PartRepository;
import com.windchill.repository.SavedSearchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SavedSearchControllerTest {

    private MockMvc mockMvc;

    @Mock SavedSearchRepository savedSearchRepository;
    @Mock PartRepository partRepository;
    @Mock DocumentRepository documentRepository;
    @Mock ChangeRequestRepository changeRequestRepository;
    @Mock CurrentUserProvider currentUserProvider;
    @Spy ObjectMapper objectMapper = new ObjectMapper();
    @InjectMocks SavedSearchController controller;

    private static final String BASE = "/api/v1/plm/saved-searches";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        lenient().when(currentUserProvider.getUserId()).thenReturn(1L);
    }

    private SavedSearch buildSearch(Long id, String name, String entityType, String queryJson) {
        SavedSearch s = new SavedSearch();
        s.setId(id);
        s.setUserId(1L);
        s.setName(name);
        s.setEntityType(entityType);
        s.setQueryJson(queryJson);
        s.setIsPublic(false);
        s.setSortBy("createdAt");
        s.setSortDir("desc");
        s.setIsDeleted(false);
        return s;
    }

    // ── GET / ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /")
    class ListSearches {

        @Test @DisplayName("200 returns user's saved searches without entityType filter")
        void listAll() throws Exception {
            SavedSearch s1 = buildSearch(1L, "My Parts", "PART", "{\"lifecycleState\":\"RELEASED\"}");
            when(savedSearchRepository.findByUserIdAndIsDeletedFalse(1L)).thenReturn(List.of(s1));

            mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("My Parts"))
                .andExpect(jsonPath("$.data[0].entityType").value("PART"));
        }

        @Test @DisplayName("200 filters by entityType and includes public searches")
        void listByEntityType() throws Exception {
            SavedSearch own = buildSearch(1L, "My Open ECRs", "ECR", "{\"status\":\"OPEN\"}");
            SavedSearch pub = buildSearch(2L, "Public ECRs", "ECR", "{\"status\":\"SUBMITTED\"}");
            pub.setUserId(99L);
            pub.setIsPublic(true);

            when(savedSearchRepository.findByUserIdAndIsDeletedFalse(1L)).thenReturn(List.of(own));
            when(savedSearchRepository.findByEntityTypeAndIsPublicTrueAndIsDeletedFalse("ECR"))
                .thenReturn(List.of(pub));

            mockMvc.perform(get(BASE).param("entityType", "ECR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
        }

        @Test @DisplayName("200 returns empty list when no saved searches")
        void emptyList() throws Exception {
            when(savedSearchRepository.findByUserIdAndIsDeletedFalse(1L)).thenReturn(List.of());

            mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));
        }
    }

    // ── POST / ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("POST /")
    class Create {

        @Test @DisplayName("200 creates a saved search")
        void create() throws Exception {
            String body = """
                {"name":"My Open ECRs","entityType":"ECR","queryJson":"{\\"status\\":\\"SUBMITTED\\"}","isPublic":false}
                """;

            SavedSearch saved = buildSearch(10L, "My Open ECRs", "ECR", "{\"status\":\"SUBMITTED\"}");
            when(savedSearchRepository.save(any(SavedSearch.class))).thenReturn(saved);

            mockMvc.perform(post(BASE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("My Open ECRs"))
                .andExpect(jsonPath("$.data.entityType").value("ECR"));
        }

        @Test @DisplayName("400 when name is blank")
        void missingName() throws Exception {
            String body = """
                {"name":"","entityType":"PART"}
                """;

            mockMvc.perform(post(BASE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("400 when entityType is blank")
        void missingEntityType() throws Exception {
            String body = """
                {"name":"Test","entityType":""}
                """;

            mockMvc.perform(post(BASE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isBadRequest());
        }
    }

    // ── PUT /{id} ──────────────────────────────────────────────────────────

    @Nested @DisplayName("PUT /{id}")
    class Update {

        @Test @DisplayName("200 updates name and queryJson")
        void update() throws Exception {
            SavedSearch existing = buildSearch(5L, "Old Name", "PART", "{}");
            when(savedSearchRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(savedSearchRepository.save(any(SavedSearch.class))).thenReturn(existing);

            String body = """
                {"name":"Updated Name","queryJson":"{\\"lifecycleState\\":\\"RELEASED\\"}"}
                """;

            mockMvc.perform(put(BASE + "/5")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Name"));
        }

        @Test @DisplayName("500 when saved search not found")
        void notFound() throws Exception {
            when(savedSearchRepository.findById(99L)).thenReturn(Optional.empty());

            mockMvc.perform(put(BASE + "/99")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"X\"}"))
                .andExpect(status().is5xxServerError());
        }
    }

    // ── DELETE /{id} ───────────────────────────────────────────────────────

    @Nested @DisplayName("DELETE /{id}")
    class Delete {

        @Test @DisplayName("200 soft-deletes a saved search")
        void softDelete() throws Exception {
            SavedSearch existing = buildSearch(5L, "To Delete", "PART", "{}");
            when(savedSearchRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(savedSearchRepository.save(any(SavedSearch.class))).thenReturn(existing);

            mockMvc.perform(delete(BASE + "/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

            verify(savedSearchRepository).save(argThat(SavedSearch::getIsDeleted));
        }

        @Test @DisplayName("500 when saved search not found")
        void notFound() throws Exception {
            when(savedSearchRepository.findById(99L)).thenReturn(Optional.empty());

            mockMvc.perform(delete(BASE + "/99"))
                .andExpect(status().is5xxServerError());
        }
    }

    // ── POST /{id}/execute ─────────────────────────────────────────────────

    @Nested @DisplayName("POST /{id}/execute")
    class Execute {

        @Test @DisplayName("200 executes part search with filters")
        void executePartSearch() throws Exception {
            SavedSearch s = buildSearch(1L, "Released Parts", "PART",
                    "{\"lifecycleState\":\"RELEASED\",\"partNumber\":\"SW-\"}");
            when(savedSearchRepository.findById(1L)).thenReturn(Optional.of(s));
            when(partRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                    .thenReturn(List.of());

            mockMvc.perform(post(BASE + "/1/execute"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
        }

        @Test @DisplayName("200 executes document search with filters")
        void executeDocumentSearch() throws Exception {
            SavedSearch s = buildSearch(2L, "Draft Docs", "DOCUMENT",
                    "{\"status\":\"DRAFT\"}");
            when(savedSearchRepository.findById(2L)).thenReturn(Optional.of(s));
            when(documentRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                    .thenReturn(List.of());

            mockMvc.perform(post(BASE + "/2/execute"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        }

        @Test @DisplayName("200 executes ECR search with filters")
        void executeEcrSearch() throws Exception {
            SavedSearch s = buildSearch(3L, "Submitted ECRs", "ECR",
                    "{\"status\":\"SUBMITTED\",\"priority\":\"HIGH\"}");
            when(savedSearchRepository.findById(3L)).thenReturn(Optional.of(s));
            when(changeRequestRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                    .thenReturn(List.of());

            mockMvc.perform(post(BASE + "/3/execute"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        }

        @Test @DisplayName("200 handles invalid JSON gracefully")
        void invalidJson() throws Exception {
            SavedSearch s = buildSearch(4L, "Bad JSON", "PART", "not-valid-json");
            when(savedSearchRepository.findById(4L)).thenReturn(Optional.of(s));
            when(partRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                    .thenReturn(List.of());

            mockMvc.perform(post(BASE + "/4/execute"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        }

        @Test @DisplayName("500 when saved search not found")
        void notFound() throws Exception {
            when(savedSearchRepository.findById(99L)).thenReturn(Optional.empty());

            mockMvc.perform(post(BASE + "/99/execute"))
                .andExpect(status().is5xxServerError());
        }
    }
}
