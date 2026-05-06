package com.windchill.service.plm;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.ObjectTemplate;
import com.windchill.repository.ObjectTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TemplateServiceImpl implements ITemplateService {

    private final ObjectTemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ObjectTemplate> listByTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return templateRepository.findAllByIsDeletedFalse();
        }
        return templateRepository.findByTargetTypeAndIsDeletedFalse(targetType);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ObjectTemplate> listAll() {
        return templateRepository.findAllByIsDeletedFalse();
    }

    @Override
    public ObjectTemplate create(ObjectTemplate template) {
        if (template.getTemplateName() == null || template.getTemplateName().isBlank()) {
            throw new BusinessException("templateName is required");
        }
        if (template.getTargetType() == null || template.getTargetType().isBlank()) {
            throw new BusinessException("targetType is required");
        }
        ObjectTemplate saved = templateRepository.save(template);
        log.info("Created object template: {} for {}", saved.getTemplateName(), saved.getTargetType());
        return saved;
    }

    @Override
    public ObjectTemplate update(Long id, ObjectTemplate details) {
        ObjectTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ObjectTemplate", "id", id));

        if (details.getTemplateName() != null) template.setTemplateName(details.getTemplateName());
        if (details.getDescription() != null) template.setDescription(details.getDescription());
        if (details.getTemplateData() != null) template.setTemplateData(details.getTemplateData());
        if (details.getIsPublic() != null) template.setIsPublic(details.getIsPublic());
        if (details.getCategory() != null) template.setCategory(details.getCategory());
        if (details.getIconName() != null) template.setIconName(details.getIconName());

        return templateRepository.save(template);
    }

    @Override
    public void deleteTemplate(Long id) {
        ObjectTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ObjectTemplate", "id", id));
        template.setIsDeleted(true);
        templateRepository.save(template);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> applyTemplate(Long id) {
        ObjectTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ObjectTemplate", "id", id));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("templateId", template.getId());
        result.put("templateName", template.getTemplateName());
        result.put("targetType", template.getTargetType());

        // Parse templateData JSON and return pre-filled fields
        if (template.getTemplateData() != null && !template.getTemplateData().isBlank()) {
            try {
                Map<String, Object> data = objectMapper.readValue(
                        template.getTemplateData(), new TypeReference<Map<String, Object>>() {});
                result.put("prefilledFields", data);
            } catch (Exception e) {
                log.warn("Failed to parse template data for template {}: {}", id, e.getMessage());
                result.put("prefilledFields", Map.of());
            }
        } else {
            result.put("prefilledFields", Map.of());
        }

        return result;
    }
}
