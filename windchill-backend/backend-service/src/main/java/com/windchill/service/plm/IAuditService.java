package com.windchill.service.plm;

import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;

import java.util.List;

public interface IAuditService {

    /** Get all audit logs for a specific entity (used by PartDetailPage audit tab) */
    List<AuditLog> getLogs(PlmEntityTypeEnum entityType, Long entityId);

    /** Get recent audit logs across all entities, sorted DESC by createdAt */
    List<AuditLog> getAllLogs(int limit);
}
