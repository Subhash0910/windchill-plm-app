package com.windchill.service.plm;

import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;
import com.windchill.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditServiceImpl implements IAuditService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public List<AuditLog> getLogs(PlmEntityTypeEnum entityType, Long entityId) {
        log.debug("Fetching audit logs for {} #{}", entityType, entityId);
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    @Override
    public List<AuditLog> getAllLogs(int limit) {
        log.debug("Fetching global audit log, limit={}", limit);
        int safeLimit = Math.max(1, Math.min(limit, 500));
        return auditLogRepository.findAll(
                PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
    }
}
