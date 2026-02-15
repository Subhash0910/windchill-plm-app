package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.BomLine;
import com.windchill.service.plm.IBomService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class BomController {

    private final IBomService bomService;

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
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(lines).build());
    }

    @DeleteMapping("/api/v1/plm/bom-lines/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        bomService.deleteLine(id);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.DELETED).data(null).build());
    }

    @Data
    public static class AddBomLineRequest {
        private Long childPartId;
        private BigDecimal quantity;
        private String unit;
        private String findNumber;
        private Integer sortOrder;
        private String lineNote;
    }
}
