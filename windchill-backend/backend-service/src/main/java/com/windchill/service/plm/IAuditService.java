package com.windchill.service.plm;

import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;

import java.util.List;

public interface IAuditService {
    void log(PlmEntityTypeEnum type, Long id, String action, String details);
    List<AuditLog> getLogs(PlmEntityTypeEnum type, Long id);
}
