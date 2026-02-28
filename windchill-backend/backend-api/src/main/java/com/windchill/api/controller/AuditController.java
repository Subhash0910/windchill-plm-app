package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;
import com.windchill.service.plm.IAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/audit")
@RequiredArgsConstructor
@Slf4j
public class AuditController {

    private final IAuditService auditService;

    /** Per-entity audit — used by PartDetailPage audit tab */
    @GetMapping
    public ResponseEntity<ApiResponse<?>> get(
            @RequestParam PlmEntityTypeEnum entityType,
            @RequestParam Long entityId) {
        List<AuditLog> logs = auditService.getLogs(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true).message(APIConstants.SUCCESS).data(logs).build());
    }

    /** Global audit feed — used by AuditLogPage, sorted DESC by createdAt */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(defaultValue = "200") int limit) {
        log.info("Fetching global audit log, limit={}", limit);
        List<AuditLog> logs = auditService.getAllLogs(limit);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true).message(APIConstants.SUCCESS).data(logs).build());
    }
}
