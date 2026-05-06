package com.windchill.service.plm;

import com.windchill.domain.entity.ObjectTemplate;

import java.util.List;
import java.util.Map;

public interface ITemplateService {
    List<ObjectTemplate> listByTargetType(String targetType);
    List<ObjectTemplate> listAll();
    ObjectTemplate create(ObjectTemplate template);
    ObjectTemplate update(Long id, ObjectTemplate details);
    void deleteTemplate(Long id);
    Map<String, Object> applyTemplate(Long id);
}
