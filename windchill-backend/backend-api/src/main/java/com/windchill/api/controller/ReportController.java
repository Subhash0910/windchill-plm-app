package com.windchill.api.controller;

import com.windchill.common.response.ApiResponse;
import com.windchill.domain.entity.*;
import com.windchill.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/plm/reports")
@RequiredArgsConstructor
public class ReportController {

    private final PartRepository partRepository;
    private final BomLineRepository bomLineRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final ChangeOrderItemRepository changeOrderItemRepository;
    private final ChangeNoticeRepository changeNoticeRepository;

    // ── BOM Report ─────────────────────────────────────────────────────────

    /**
     * GET /api/v1/plm/reports/bom?partId=X&format=pdf
     * Generate a BOM report for a part with recursive BOM structure.
     * Returns structured JSON; the frontend handles PDF rendering.
     */
    @GetMapping("/bom")
    public ResponseEntity<ApiResponse<BomReportData>> bomReport(
            @RequestParam Long partId,
            @RequestParam(defaultValue = "pdf") String format) {
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new RuntimeException("Part not found: " + partId));

        BomReportData report = new BomReportData();
        report.setPart(mapPartSummary(part));
        report.setBomLines(buildBomTree(partId, new HashSet<>()));
        report.setGeneratedAt(new java.util.Date().toString());

        return ResponseEntity.ok(ApiResponse.success(report));
    }

    private List<BomTreeLine> buildBomTree(Long parentPartId, Set<Long> visited) {
        if (!visited.add(parentPartId)) {
            return List.of(); // prevent infinite recursion
        }
        List<BomLine> bomLines = bomLineRepository
                .findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(parentPartId);

        List<BomTreeLine> tree = new ArrayList<>();
        for (BomLine bl : bomLines) {
            Part childPart = partRepository.findById(bl.getChildPartId()).orElse(null);
            if (childPart == null) continue;

            BomTreeLine node = new BomTreeLine();
            node.setPart(mapPartSummary(childPart));
            node.setQuantity(bl.getQuantity() != null ? bl.getQuantity().toPlainString() : "1");
            node.setUnit(bl.getUnit());
            node.setFindNumber(bl.getFindNumber());
            node.setLineNote(bl.getLineNote());
            node.setSortOrder(bl.getSortOrder());
            node.setReferenceDesignator(bl.getReferenceDesignator());

            // recurse into sub-assemblies
            node.setChildren(buildBomTree(childPart.getId(), new HashSet<>(visited)));

            tree.add(node);
        }
        visited.remove(parentPartId);
        return tree;
    }

    private PartSummary mapPartSummary(Part p) {
        PartSummary ps = new PartSummary();
        ps.setId(p.getId());
        ps.setPartNumber(p.getPartNumber());
        ps.setName(p.getName());
        ps.setRevision(p.getRevision());
        ps.setIteration(p.getIteration());
        ps.setLifecycleState(p.getLifecycleState() != null ? p.getLifecycleState().name() : null);
        ps.setDescription(p.getDescription());
        return ps;
    }

    // ── Part List CSV Export ────────────────────────────────────────────────

    /**
     * GET /api/v1/plm/reports/part-list?contextId=X&format=csv
     * Export part list as CSV. Returns text/csv content type.
     */
    @GetMapping("/part-list")
    public ResponseEntity<String> partListCsv(
            @RequestParam Long contextId,
            @RequestParam(defaultValue = "csv") String format) {
        List<Part> parts = partRepository.findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(contextId);

        StringBuilder csv = new StringBuilder();
        // header
        csv.append("ID,Part Number,Name,Revision,Iteration,Lifecycle State,Description,Created At\n");
        for (Part p : parts) {
            csv.append(escapeCsv(p.getId()));
            csv.append(",").append(escapeCsv(p.getPartNumber()));
            csv.append(",").append(escapeCsv(p.getName()));
            csv.append(",").append(escapeCsv(p.getRevision()));
            csv.append(",").append(p.getIteration());
            csv.append(",").append(escapeCsv(p.getLifecycleState() != null ? p.getLifecycleState().name() : ""));
            csv.append(",").append(escapeCsv(p.getDescription()));
            csv.append(",").append(escapeCsv(p.getCreatedAt() != null ? p.getCreatedAt().toString() : ""));
            csv.append("\n");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"part-list-" + contextId + ".csv\"");
        return ResponseEntity.ok().headers(headers).body(csv.toString());
    }

    private String escapeCsv(Object value) {
        if (value == null) return "";
        String s = value.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    // ── Change Summary Report ───────────────────────────────────────────────

    /**
     * GET /api/v1/plm/reports/change-summary?ecrId=X
     * Generate a change summary report with ECR details, impacted parts, and order items.
     */
    @GetMapping("/change-summary")
    public ResponseEntity<ApiResponse<ChangeSummaryData>> changeSummary(
            @RequestParam Long ecrId) {
        ChangeRequest cr = changeRequestRepository.findById(ecrId)
                .orElseThrow(() -> new RuntimeException("Change request not found: " + ecrId));

        ChangeSummaryData summary = new ChangeSummaryData();

        // ECR details
        summary.setChangeNumber(cr.getChangeNumber());
        summary.setTitle(cr.getTitle());
        summary.setDescription(cr.getDescription());
        summary.setReason(cr.getReason());
        summary.setPriority(cr.getPriority() != null ? cr.getPriority().name() : null);
        summary.setStatus(cr.getStatus() != null ? cr.getStatus().name() : null);
        summary.setCreatedBy(cr.getCreatedBy());
        summary.setCreatedAt(cr.getCreatedAt() != null ? cr.getCreatedAt().toString() : null);
        summary.setSubmittedAt(cr.getSubmittedAt() != null ? cr.getSubmittedAt().toString() : null);
        summary.setReviewedBy(cr.getReviewedBy());
        summary.setReviewedAt(cr.getReviewedAt() != null ? cr.getReviewedAt().toString() : null);
        summary.setResolutionComment(cr.getResolutionComment());
        summary.setClosedBy(cr.getClosedBy());
        summary.setClosedAt(cr.getClosedAt() != null ? cr.getClosedAt().toString() : null);

        // Impacted parts
        String raw = cr.getImpactedPartIds();
        if (raw != null && !raw.isBlank()) {
            List<Long> partIds = Arrays.stream(raw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
            List<Part> parts = partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(partIds);
            summary.setImpactedParts(parts.stream().map(this::mapPartSummary).collect(Collectors.toList()));
        } else {
            summary.setImpactedParts(List.of());
        }

        // Change order items
        List<ChangeOrderItem> items = changeOrderItemRepository.findByChangeRequestIdOrderByIdAsc(ecrId);
        List<ChangeSummaryData.OrderItemSummary> itemSummaries = items.stream().map(item -> {
            ChangeSummaryData.OrderItemSummary ois = new ChangeSummaryData.OrderItemSummary();
            ois.setId(item.getId());
            ois.setOriginalPartId(item.getOriginalPartId());
            ois.setOriginalPartNumber(item.getOriginalPartNumber());
            ois.setOriginalRevision(item.getOriginalRevision());
            ois.setNewPartId(item.getNewPartId());
            ois.setNewRevision(item.getNewRevision());
            ois.setActionNote(item.getActionNote());
            return ois;
        }).collect(Collectors.toList());
        summary.setOrderItems(itemSummaries);

        // Change notice
        changeNoticeRepository.findByChangeRequestId(ecrId).ifPresent(cn -> {
            ChangeSummaryData.NoticeSummary ns = new ChangeSummaryData.NoticeSummary();
            ns.setId(cn.getId());
            ns.setNoticeNumber(cn.getNoticeNumber());
            ns.setTitle(cn.getTitle());
            ns.setSummary(cn.getSummary());
            ns.setStatus(cn.getStatus() != null ? cn.getStatus().name() : null);
            ns.setReleasedBy(cn.getReleasedBy());
            ns.setReleasedAt(cn.getReleasedAt() != null ? cn.getReleasedAt().toString() : null);
            summary.setNotice(ns);
        });

        summary.setGeneratedAt(new java.util.Date().toString());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // ── Inner DTOs ─────────────────────────────────────────────────────────

    @lombok.Data
    public static class BomReportData {
        private PartSummary part;
        private List<BomTreeLine> bomLines;
        private String generatedAt;
    }

    @lombok.Data
    public static class BomTreeLine {
        private PartSummary part;
        private String quantity;
        private String unit;
        private String findNumber;
        private String lineNote;
        private Integer sortOrder;
        private String referenceDesignator;
        private List<BomTreeLine> children;
    }

    @lombok.Data
    public static class PartSummary {
        private Long id;
        private String partNumber;
        private String name;
        private String revision;
        private Integer iteration;
        private String lifecycleState;
        private String description;
    }

    @lombok.Data
    public static class ChangeSummaryData {
        private String changeNumber;
        private String title;
        private String description;
        private String reason;
        private String priority;
        private String status;
        private String createdBy;
        private String createdAt;
        private String submittedAt;
        private String reviewedBy;
        private String reviewedAt;
        private String resolutionComment;
        private String closedBy;
        private String closedAt;
        private List<PartSummary> impactedParts;
        private List<OrderItemSummary> orderItems;
        private NoticeSummary notice;
        private String generatedAt;

        @lombok.Data
        public static class OrderItemSummary {
            private Long id;
            private Long originalPartId;
            private String originalPartNumber;
            private String originalRevision;
            private Long newPartId;
            private String newRevision;
            private String actionNote;
        }

        @lombok.Data
        public static class NoticeSummary {
            private Long id;
            private String noticeNumber;
            private String title;
            private String summary;
            private String status;
            private String releasedBy;
            private String releasedAt;
        }
    }
}
