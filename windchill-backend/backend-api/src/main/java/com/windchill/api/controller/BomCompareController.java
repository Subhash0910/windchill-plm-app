package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/plm/bom")
@RequiredArgsConstructor
public class BomCompareController {

    private final BomLineRepository bomLineRepository;
    private final PartRepository partRepository;

    // ─── GET /compare?part1Id=X&part2Id=Y ──────────────────────────────────────

    @GetMapping("/compare")
    public ResponseEntity<ApiResponse<?>> compare(@RequestParam Long part1Id,
                                                   @RequestParam Long part2Id) {
        Part part1 = partRepository.findById(part1Id)
                .orElseThrow(() -> new BusinessException("Part not found: " + part1Id));
        Part part2 = partRepository.findById(part2Id)
                .orElseThrow(() -> new BusinessException("Part not found: " + part2Id));

        // Recursively fetch all BOM lines for both parts
        List<BomLineEntry> part1Lines = fetchBomRecursive(part1Id, 1);
        List<BomLineEntry> part2Lines = fetchBomRecursive(part2Id, 1);

        // Key each line by (partNumber, findNumber) for comparison
        Map<String, BomLineEntry> part1Map = part1Lines.stream()
                .collect(Collectors.toMap(e -> key(e), e -> e, (a, b) -> a, LinkedHashMap::new));
        Map<String, BomLineEntry> part2Map = part2Lines.stream()
                .collect(Collectors.toMap(e -> key(e), e -> e, (a, b) -> a, LinkedHashMap::new));

        List<ChangeEntry> changes = new ArrayList<>();
        int added = 0, removed = 0, modified = 0, unchanged = 0;

        // Check part2 entries against part1 (ADDED / MODIFIED / UNCHANGED)
        for (Map.Entry<String, BomLineEntry> e : part2Map.entrySet()) {
            String k = e.getKey();
            BomLineEntry p2Entry = e.getValue();
            if (!part1Map.containsKey(k)) {
                changes.add(new ChangeEntry("ADDED", p2Entry.partNumber, p2Entry.partName,
                        null, p2Entry.quantity, p2Entry.bomLevel));
                added++;
            } else {
                BomLineEntry p1Entry = part1Map.get(k);
                if (p1Entry.quantity.compareTo(p2Entry.quantity) != 0) {
                    changes.add(new ChangeEntry("MODIFIED", p2Entry.partNumber, p2Entry.partName,
                            p1Entry.quantity, p2Entry.quantity, p2Entry.bomLevel));
                    modified++;
                } else {
                    unchanged++;
                }
            }
        }

        // REMOVED: in part1 but not in part2
        for (Map.Entry<String, BomLineEntry> e : part1Map.entrySet()) {
            String k = e.getKey();
            BomLineEntry p1Entry = e.getValue();
            if (!part2Map.containsKey(k)) {
                changes.add(new ChangeEntry("REMOVED", p1Entry.partNumber, p1Entry.partName,
                        p1Entry.quantity, null, p1Entry.bomLevel));
                removed++;
            }
        }

        BomCompareResult result = new BomCompareResult(
                new PartInfo(part1.getId(), part1.getPartNumber(), part1.getRevision()),
                new PartInfo(part2.getId(), part2.getPartNumber(), part2.getRevision()),
                new CompareSummary(added, removed, modified, unchanged, added + removed + modified),
                changes,
                part1Lines,
                part2Lines
        );

        return ok(result);
    }

    // ─── Recursive BOM fetch ───────────────────────────────────────────────────

    private List<BomLineEntry> fetchBomRecursive(Long partId, int level) {
        List<BomLineEntry> result = new ArrayList<>();
        List<BomLine> lines = bomLineRepository
                .findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(partId);

        for (BomLine line : lines) {
            Part childPart = partRepository.findById(line.getChildPartId()).orElse(null);
            String partNumber = childPart != null ? childPart.getPartNumber() : "UNKNOWN-" + line.getChildPartId();
            String partName = childPart != null ? childPart.getName() : null;

            result.add(new BomLineEntry(
                    line.getId(),
                    line.getChildPartId(),
                    partNumber,
                    partName,
                    line.getQuantity(),
                    line.getFindNumber(),
                    level
            ));

            // Recurse into child BOM
            result.addAll(fetchBomRecursive(line.getChildPartId(), level + 1));
        }
        return result;
    }

    private static String key(BomLineEntry e) {
        return e.partNumber + "::" + (e.findNumber != null ? e.findNumber : "");
    }

    // ─── DTOs ──────────────────────────────────────────────────────────────────

    @Data
    @AllArgsConstructor
    public static class BomCompareResult {
        private PartInfo part1;
        private PartInfo part2;
        private CompareSummary summary;
        private List<ChangeEntry> changes;
        private List<BomLineEntry> part1Lines;
        private List<BomLineEntry> part2Lines;
    }

    @Data
    @AllArgsConstructor
    public static class PartInfo {
        private Long id;
        private String number;
        private String revision;
    }

    @Data
    @AllArgsConstructor
    public static class CompareSummary {
        private int added;
        private int removed;
        private int modified;
        private int unchanged;
        private int totalChanges;
    }

    @Data
    @AllArgsConstructor
    public static class ChangeEntry {
        private String type;          // ADDED | REMOVED | MODIFIED
        private String partNumber;
        private String partName;
        private BigDecimal oldQty;    // null for ADDED
        private BigDecimal newQty;    // null for REMOVED
        private int bomLevel;
    }

    @Data
    @AllArgsConstructor
    public static class BomLineEntry {
        private Long lineId;
        private Long childPartId;
        private String partNumber;
        private String partName;
        private BigDecimal quantity;
        private String findNumber;
        private int bomLevel;
    }

    // ─── Helper ────────────────────────────────────────────────────────────────

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(data).build());
    }
}
