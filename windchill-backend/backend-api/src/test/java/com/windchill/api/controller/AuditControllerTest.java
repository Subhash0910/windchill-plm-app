package com.windchill.api.controller;

import com.windchill.api.exception.GlobalExceptionHandler;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;
import com.windchill.service.plm.IAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuditControllerTest {

    private MockMvc mockMvc;

    @Mock IAuditService auditService;
    @InjectMocks AuditController controller;

    private static final String BASE = "/api/v1/plm/audit";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    // ── GET / ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("GET / (per-entity audit)")
    class GetEntity {

        @Test @DisplayName("200 returns logs for PART entity")
        void partLogs() throws Exception {
            AuditLog log = new AuditLog();
            log.setEntityType(PlmEntityTypeEnum.PART);
            log.setEntityId(7L);
            log.setAction("PROMOTE");
            log.setActor("alice");

            when(auditService.getLogs(PlmEntityTypeEnum.PART, 7L)).thenReturn(List.of(log));

            mockMvc.perform(get(BASE).param("entityType", "PART").param("entityId", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].action").value("PROMOTE"))
                .andExpect(jsonPath("$.data[0].actor").value("alice"));
        }

        @Test @DisplayName("200 returns empty array when no logs")
        void empty() throws Exception {
            when(auditService.getLogs(PlmEntityTypeEnum.DOCUMENT, 99L)).thenReturn(List.of());

            mockMvc.perform(get(BASE).param("entityType", "DOCUMENT").param("entityId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        }

        @Test @DisplayName("200 works for all entity types")
        void bomLine() throws Exception {
            when(auditService.getLogs(PlmEntityTypeEnum.BOM_LINE, 3L)).thenReturn(List.of());

            mockMvc.perform(get(BASE).param("entityType", "BOM_LINE").param("entityId", "3"))
                .andExpect(status().isOk());

            verify(auditService).getLogs(PlmEntityTypeEnum.BOM_LINE, 3L);
        }
    }

    // ── GET /all ───────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /all (global feed)")
    class GetAll {

        @Test @DisplayName("200 returns logs with default limit 200")
        void defaultLimit() throws Exception {
            AuditLog log = new AuditLog();
            log.setAction("CREATE"); log.setActor("bob");

            when(auditService.getAllLogs(200)).thenReturn(List.of(log));

            mockMvc.perform(get(BASE + "/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].action").value("CREATE"));

            verify(auditService).getAllLogs(200);
        }

        @Test @DisplayName("200 passes custom limit to service")
        void customLimit() throws Exception {
            when(auditService.getAllLogs(50)).thenReturn(List.of());

            mockMvc.perform(get(BASE + "/all").param("limit", "50"))
                .andExpect(status().isOk());

            verify(auditService).getAllLogs(50);
        }

        @Test @DisplayName("200 returns empty list when no global logs")
        void empty() throws Exception {
            when(auditService.getAllLogs(200)).thenReturn(List.of());

            mockMvc.perform(get(BASE + "/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        }
    }
}
