package com.windchill.service.plm;

import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;
import com.windchill.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuditServiceImpl implements IAuditService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public void log(PlmEntityTypeEnum type, Long id, String action, String details) {
        AuditLog logRow = new AuditLog();
        logRow.setEntityType(type);
        logRow.setEntityId(id);
        logRow.setAction(action);
        logRow.setDetails(details);
        logRow.setActor(currentUsername());
        auditLogRepository.save(logRow);
        log.debug("Audit: {} {} {}", type, id, action);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getLogs(PlmEntityTypeEnum type, Long id) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(type, id);
    }

    private String currentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return "system";
            if (auth.getName() == null) return "system";
            return auth.getName();
        } catch (Exception ex) {
            return "system";
        }
    }
}
