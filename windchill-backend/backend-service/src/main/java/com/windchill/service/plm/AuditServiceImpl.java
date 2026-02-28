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
    public void log(PlmEntityTypeEnum entityType, Long entityId, String action, String actor) {
        log.debug("Audit: {} #{} -> {} by {}", entityType, entityId, action, actor);
        AuditLog entry = new AuditLog();
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setAction(action);
        entry.setActor(actor);
        auditLogRepository.save(entry);
    }

    @Override
    public List<AuditLog> getLogs(PlmEntityTypeEnum entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    @Override
    public List<AuditLog> getAllLogs(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 500));
        return auditLogRepository.findAll(
                PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
    }
}
