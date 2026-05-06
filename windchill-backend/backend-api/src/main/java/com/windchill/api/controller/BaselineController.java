package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.*;
import com.windchill.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/plm/baselines")
@RequiredArgsConstructor
public class BaselineController {

    private final BaselineRepository baselineRepo;
    private final BaselineLineRepository lineRepo;
    private final BomLineRepository bomLineRepo;
    private final PartRepository partRepo;

    @GetMapping
    public ResponseEntity<ApiResponse> list(@RequestParam(required = false) Long contextId,
                                            @RequestParam(required = false) Long partId) {
        List<Baseline> baselines;
        if (partId != null) baselines = baselineRepo.findByPartIdAndIsDeletedFalseOrderByCreatedAtDesc(partId);
        else if (contextId != null) baselines = baselineRepo.findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(contextId);
        else baselines = baselineRepo.findAll();
        return ResponseEntity.ok(ApiResponse.success(baselines));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> get(@PathVariable Long id) {
        Baseline b = baselineRepo.findById(id).orElseThrow();
        List<BaselineLine> lines = lineRepo.findByBaselineIdOrderByBomLevelAscSortOrderAsc(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("baseline", b, "lines", lines)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody Map<String, Object> body) {
        Long partId = ((Number) body.get("partId")).longValue();
        Long contextId = body.containsKey("contextId") ? ((Number) body.get("contextId")).longValue() : 1L;
        String name = (String) body.getOrDefault("name", "Baseline " + LocalDateTime.now());
        String type = (String) body.getOrDefault("baselineType", "PRODUCT");
        var part = partRepo.findById(partId).orElseThrow();

        Baseline baseline = Baseline.builder().name(name).contextId(contextId)
            .partId(partId).partNumber(part.getPartNumber()).partName(part.getName())
            .partRevision(part.getRevision()).baselineType(type).isFrozen(false).build();
        baseline = baselineRepo.save(baseline);

        List<BaselineLine> lines = new ArrayList<>();
        captureBom(partId, 0, 0, baseline.getId(), lines);
        lineRepo.saveAll(lines);
        baseline.setTotalLines(lines.size());
        baselineRepo.save(baseline);
        return ResponseEntity.ok(ApiResponse.success(Map.of("baseline", baseline, "lines", lines)));
    }

    private void captureBom(Long parentId, int level, int sort, Long baselineId, List<BaselineLine> lines) {
        List<BomLine> bomLines = bomLineRepo.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(parentId);
        int idx = 0;
        for (BomLine bl : bomLines) {
            var part = partRepo.findById(bl.getChildPartId()).orElse(null);
            if (part == null) continue;
            BaselineLine bll = BaselineLine.builder().baselineId(baselineId).partId(bl.getChildPartId())
                .parentPartId(bl.getParentPartId()).partNumber(part.getPartNumber())
                .partName(part.getName()).partRevision(part.getRevision())
                .quantity(bl.getQuantity()).unit(bl.getUnit()).findNumber(bl.getFindNumber())
                .bomLevel(level).sortOrder(sort + idx).build();
            lines.add(bll);
            idx++;
            captureBom(bl.getChildPartId(), level + 1, sort + idx * 100, baselineId, lines);
        }
    }

    @GetMapping("/{id}/lines")
    public ResponseEntity<ApiResponse> getLines(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(lineRepo.findByBaselineIdOrderByBomLevelAscSortOrderAsc(id)));
    }

    @PostMapping("/{id}/freeze")
    public ResponseEntity<ApiResponse> freeze(@PathVariable Long id, @RequestParam String username) {
        Baseline b = baselineRepo.findById(id).orElseThrow();
        b.setIsFrozen(true); b.setFrozenAt(LocalDateTime.now()); b.setFrozenBy(username);
        return ResponseEntity.ok(ApiResponse.success(baselineRepo.save(b)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Long id) {
        Baseline b = baselineRepo.findById(id).orElseThrow();
        if (b.getIsFrozen()) throw new IllegalStateException("Cannot delete frozen baseline");
        b.setIsDeleted(true);
        return ResponseEntity.ok(ApiResponse.success(baselineRepo.save(b)));
    }
}
