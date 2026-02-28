package com.windchill.service.plm;

import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;

import java.util.List;

public interface IAuditService {

    /**
     * Write a new audit entry — called by BomServiceImpl, PartServiceImpl,
     * PromotionWorkflowService, FolderServiceImpl, AIImpactServiceImpl,
     * PlmContextServiceImpl whenever a PLM entity changes.
     */
    void log(PlmEntityTypeEnum entityType, Long entityId, String action, String actor);

    /** Read audit trail for one specific entity (used by PartDetailPage audit tab). */
    List<AuditLog> getLogs(PlmEntityTypeEnum entityType, Long entityId);

    /** Read recent audit entries across ALL entities (used by AuditLogPage global feed). */
    List<AuditLog> getAllLogs(int limit);
}
