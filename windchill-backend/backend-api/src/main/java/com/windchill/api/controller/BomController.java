package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.plm.IBomService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Slf4j
public class BomController {

    private final IBomService bomService;
    private final PartRepository partRepository;
    private final BomLineRepository bomLineRepository;

    @PostMapping("/api/v1/plm/parts/{parentPartId}/bom")
    public ResponseEntity<ApiResponse<?>> add(@PathVariable Long parentPartId, @RequestBody AddBomLineRequest req) {
        BomLine created = bomService.addLine(
                parentPartId,
                req.getChildPartId(),
                req.getQuantity(),
                req.getUnit(),
                req.getFindNumber(),
                req.getSortOrder(),
                req.getLineNote()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(created).build());
    }

    @GetMapping("/api/v1/plm/parts/{parentPartId}/bom")
    public ResponseEntity<ApiResponse<?>> list(@PathVariable Long parentPartId) {
        List<BomLine> lines = bomService.listBom(parentPartId);
        if (lines.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(List.of()).build());
        }

        List<Long> childIds = lines.stream().map(BomLine::getChildPartId).distinct().collect(Collectors.toList());
        Map<Long, Part> partMap = partRepository.findAllById(childIds).stream()
                .collect(Collectors.toMap(Part::getId, p -> p));

        List<BomLineDto> dtos = lines.stream().map(l -> {
            Part child = partMap.get(l.getChildPartId());
            long childCount = bomLineRepository.countByParentPartIdAndIsDeletedFalse(l.getChildPartId());
            return new BomLineDto(l, child, childCount);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(dtos).build());
    }

    @DeleteMapping("/api/v1/plm/bom-lines/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        bomService.deleteLine(id);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.DELETED).data(null).build());
    }

    /* ── Request / Response DTOs ─────────────────────────────────────────── */

    @Data
    public static class AddBomLineRequest {
        private Long childPartId;
        private BigDecimal quantity;
        private String unit;
        private String findNumber;
        private Integer sortOrder;
        private String lineNote;
    }

    @Data
    public static class ChildPartDto {
        private Long id;
        private String partNumber;
        private String name;
        private String revision;
        private Integer iteration;
        private String lifecycleState;

        public static ChildPartDto from(Part p) {
            if (p == null) return null;
            ChildPartDto dto = new ChildPartDto();
            dto.id = p.getId();
            dto.partNumber = p.getPartNumber();
            dto.name = p.getName();
            dto.revision = p.getRevision();
            dto.iteration = p.getIteration();
            dto.lifecycleState = p.getLifecycleState() != null ? p.getLifecycleState().name() : null;
            return dto;
        }
    }

    @Data
    public static class BomLineDto {
        private Long id;
        private Long parentPartId;
        private Long childPartId;
        private BigDecimal quantity;
        private String unit;
        private String findNumber;
        private String lineNote;
        private Integer sortOrder;
        private long childCount;
        private ChildPartDto childPart;

        public BomLineDto(BomLine line, Part child, long childCount) {
            this.id = line.getId();
            this.parentPartId = line.getParentPartId();
            this.childPartId = line.getChildPartId();
            this.quantity = line.getQuantity();
            this.unit = line.getUnit();
            this.findNumber = line.getFindNumber();
            this.lineNote = line.getLineNote();
            this.sortOrder = line.getSortOrder();
            this.childCount = childCount;
            this.childPart = ChildPartDto.from(child);
        }
    }
}
