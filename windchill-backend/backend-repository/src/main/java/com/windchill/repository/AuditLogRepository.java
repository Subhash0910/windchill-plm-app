package com.windchill.repository;

import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(PlmEntityTypeEnum entityType, Long entityId);
}
