package com.windchill.api.controller;

import com.windchill.api.exception.GlobalExceptionHandler;
import com.windchill.common.enums.ChangeNoticeStatus;
import com.windchill.common.enums.ChangePriority;
import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.*;
import com.windchill.repository.*;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    private MockMvc mockMvc;

    @Mock PartRepository partRepository;
    @Mock BomLineRepository bomLineRepository;
    @Mock ChangeRequestRepository changeRequestRepository;
    @Mock ChangeOrderItemRepository changeOrderItemRepository;
    @Mock ChangeNoticeRepository changeNoticeRepository;
    @InjectMocks ReportController controller;

    private static final String BASE = "/api/v1/plm/reports";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    private Part buildPart(Long id, String partNumber, String name, LifecycleStateEnum state) {
        Part p = new Part();
        p.setId(id);
        p.setPartNumber(partNumber);
        p.setName(name);
        p.setRevision("A");
        p.setIteration(1);
        p.setLifecycleState(state);
        p.setDescription("Test part " + id);
        return p;
    }

    private BomLine buildBomLine(Long id, Long parentPartId, Long childPartId) {
        BomLine bl = new BomLine();
        bl.setId(id);
        bl.setParentPartId(parentPartId);
        bl.setChildPartId(childPartId);
        bl.setQuantity(new BigDecimal("2.0"));
        bl.setUnit("EA");
        bl.setSortOrder(1);
        return bl;
    }

    private ChangeRequest buildCr(Long id, String changeNumber) {
        ChangeRequest cr = new ChangeRequest();
        cr.setId(id);
        cr.setChangeNumber(changeNumber);
        cr.setTitle("Test ECR");
        cr.setDescription("Test description");
        cr.setPriority(ChangePriority.HIGH);
        cr.setStatus(ChangeRequestStatus.SUBMITTED);
        cr.setCreatedBy("alice");
        cr.setImpactedPartIds("1,2,3");
        return cr;
    }

    // ── GET /bom ───────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /bom")
    class BomReport {

        @Test @DisplayName("200 returns BOM report for a part with no children")
        void singleLevelBom() throws Exception {
            Part p = buildPart(1L, "ASSY-001", "Top Assembly", LifecycleStateEnum.RELEASED);
            when(partRepository.findById(1L)).thenReturn(Optional.of(p));
            when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(1L))
                    .thenReturn(List.of());

            mockMvc.perform(get(BASE + "/bom").param("partId", "1").param("format", "pdf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.part.partNumber").value("ASSY-001"))
                .andExpect(jsonPath("$.data.part.name").value("Top Assembly"))
                .andExpect(jsonPath("$.data.bomLines").isArray())
                .andExpect(jsonPath("$.data.bomLines.length()").value(0));
        }

        @Test @DisplayName("200 returns BOM report with children")
        void multiLevelBom() throws Exception {
            Part parent = buildPart(1L, "ASSY-001", "Top Assembly", LifecycleStateEnum.RELEASED);
            Part child = buildPart(2L, "COMP-001", "Component", LifecycleStateEnum.RELEASED);

            BomLine bl = buildBomLine(10L, 1L, 2L);

            when(partRepository.findById(1L)).thenReturn(Optional.of(parent));
            when(partRepository.findById(2L)).thenReturn(Optional.of(child));
            when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(1L))
                    .thenReturn(List.of(bl));
            when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(2L))
                    .thenReturn(List.of());

            mockMvc.perform(get(BASE + "/bom").param("partId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bomLines.length()").value(1))
                .andExpect(jsonPath("$.data.bomLines[0].part.partNumber").value("COMP-001"))
                .andExpect(jsonPath("$.data.bomLines[0].quantity").value("2.0"))
                .andExpect(jsonPath("$.data.bomLines[0].children").isArray());
        }

        @Test @DisplayName("500 when part not found")
        void partNotFound() throws Exception {
            when(partRepository.findById(99L)).thenReturn(Optional.empty());

            mockMvc.perform(get(BASE + "/bom").param("partId", "99"))
                .andExpect(status().is5xxServerError());
        }
    }

    // ── GET /part-list ─────────────────────────────────────────────────────

    @Nested @DisplayName("GET /part-list")
    class PartListCsv {

        @Test @DisplayName("200 returns CSV with headers and part rows")
        void csvExport() throws Exception {
            Part p1 = buildPart(1L, "PART-001", "Bolt", LifecycleStateEnum.RELEASED);
            Part p2 = buildPart(2L, "PART-002", "Nut, Inc.", LifecycleStateEnum.INWORK);
            when(partRepository.findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(10L))
                    .thenReturn(List.of(p1, p2));

            mockMvc.perform(get(BASE + "/part-list").param("contextId", "10").param("format", "csv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("ID,Part Number,Name")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("PART-001")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"Nut, Inc.\"")));
        }

        @Test @DisplayName("200 returns CSV with only header when no parts")
        void emptyCsv() throws Exception {
            when(partRepository.findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(99L))
                    .thenReturn(List.of());

            mockMvc.perform(get(BASE + "/part-list").param("contextId", "99"))
                .andExpect(status().isOk())
                .andExpect(content().string("ID,Part Number,Name,Revision,Iteration,Lifecycle State,Description,Created At\n"));
        }
    }

    // ── GET /change-summary ────────────────────────────────────────────────

    @Nested @DisplayName("GET /change-summary")
    class ChangeSummary {

        @Test @DisplayName("200 returns change summary with ECR details and impacted parts")
        void fullSummary() throws Exception {
            ChangeRequest cr = buildCr(1L, "ECR-0001");
            Part p1 = buildPart(1L, "PART-A", "Part A", LifecycleStateEnum.RELEASED);
            Part p2 = buildPart(2L, "PART-B", "Part B", LifecycleStateEnum.INWORK);

            ChangeOrderItem item = new ChangeOrderItem();
            item.setId(10L);
            item.setChangeRequestId(1L);
            item.setOriginalPartId(1L);
            item.setOriginalPartNumber("PART-A");
            item.setOriginalRevision("A");
            item.setNewRevision("B");

            ChangeNotice notice = new ChangeNotice();
            notice.setId(100L);
            notice.setNoticeNumber("ECN-0001");
            notice.setTitle("ECN for ECR-0001");
            notice.setStatus(ChangeNoticeStatus.OPEN);

            when(changeRequestRepository.findById(1L)).thenReturn(Optional.of(cr));
            when(partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(List.of(1L, 2L, 3L)))
                    .thenReturn(List.of(p1, p2));
            when(changeOrderItemRepository.findByChangeRequestIdOrderByIdAsc(1L))
                    .thenReturn(List.of(item));
            when(changeNoticeRepository.findByChangeRequestId(1L))
                    .thenReturn(Optional.of(notice));

            mockMvc.perform(get(BASE + "/change-summary").param("ecrId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.changeNumber").value("ECR-0001"))
                .andExpect(jsonPath("$.data.priority").value("HIGH"))
                .andExpect(jsonPath("$.data.impactedParts.length()").value(2))
                .andExpect(jsonPath("$.data.orderItems.length()").value(1))
                .andExpect(jsonPath("$.data.orderItems[0].originalPartNumber").value("PART-A"))
                .andExpect(jsonPath("$.data.notice.noticeNumber").value("ECN-0001"));
        }

        @Test @DisplayName("200 returns change summary without notice if none exists")
        void summaryWithoutNotice() throws Exception {
            ChangeRequest cr = buildCr(1L, "ECR-0002");
            cr.setImpactedPartIds(null);

            when(changeRequestRepository.findById(1L)).thenReturn(Optional.of(cr));
            when(changeOrderItemRepository.findByChangeRequestIdOrderByIdAsc(1L))
                    .thenReturn(List.of());
            when(changeNoticeRepository.findByChangeRequestId(1L))
                    .thenReturn(Optional.empty());

            mockMvc.perform(get(BASE + "/change-summary").param("ecrId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.impactedParts.length()").value(0))
                .andExpect(jsonPath("$.data.orderItems.length()").value(0))
                .andExpect(jsonPath("$.data.notice").doesNotExist());
        }

        @Test @DisplayName("500 when ECR not found")
        void ecrNotFound() throws Exception {
            when(changeRequestRepository.findById(99L)).thenReturn(Optional.empty());

            mockMvc.perform(get(BASE + "/change-summary").param("ecrId", "99"))
                .andExpect(status().is5xxServerError());
        }
    }
}
