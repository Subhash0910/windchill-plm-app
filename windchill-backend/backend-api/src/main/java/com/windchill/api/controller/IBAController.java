package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.IBAAttribute;
import com.windchill.repository.IBAAttributeRepository;
import com.windchill.repository.PartRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class IBAController {

    private final IBAAttributeRepository ibaRepository;
    private final PartRepository partRepository;

    @GetMapping("/api/v1/plm/parts/{partId}/iba")
    public ResponseEntity<ApiResponse<?>> list(@PathVariable Long partId) {
        verifyPartExists(partId);
        List<IBAAttribute> attrs = ibaRepository.findByPartIdAndIsDeletedFalseOrderByAttributeNameAsc(partId);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(attrs).build());
    }

    @PostMapping("/api/v1/plm/parts/{partId}/iba")
    public ResponseEntity<ApiResponse<?>> create(@PathVariable Long partId, @RequestBody IBARequest req) {
        verifyPartExists(partId);
        if (req.getAttributeName() == null || req.getAttributeName().isBlank()) {
            throw new BusinessException("attributeName is required");
        }
        if (ibaRepository.existsByPartIdAndAttributeNameAndIsDeletedFalse(partId, req.getAttributeName())) {
            throw new BusinessException("IBA attribute '" + req.getAttributeName() + "' already exists for this part");
        }
        IBAAttribute attr = new IBAAttribute();
        attr.setPartId(partId);
        attr.setAttributeName(req.getAttributeName().trim());
        attr.setAttributeValue(req.getAttributeValue());
        attr.setAttributeType(req.getAttributeType() != null ? req.getAttributeType() : "STRING");
        attr.setUnit(req.getUnit());
        attr.setDescription(req.getDescription());
        IBAAttribute saved = ibaRepository.save(attr);
        log.info("IBA attribute created: partId={} name={}", partId, saved.getAttributeName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(saved).build());
    }

    @PutMapping("/api/v1/plm/parts/{partId}/iba/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable Long partId, @PathVariable Long id, @RequestBody IBARequest req) {
        IBAAttribute attr = ibaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IBAAttribute", "id", id));
        if (!attr.getPartId().equals(partId)) {
            throw new BusinessException("IBA attribute does not belong to this part");
        }
        if (req.getAttributeValue() != null) attr.setAttributeValue(req.getAttributeValue());
        if (req.getAttributeType() != null) attr.setAttributeType(req.getAttributeType());
        if (req.getUnit() != null)          attr.setUnit(req.getUnit());
        if (req.getDescription() != null)   attr.setDescription(req.getDescription());
        IBAAttribute saved = ibaRepository.save(attr);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(saved).build());
    }

    @DeleteMapping("/api/v1/plm/parts/{partId}/iba/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long partId, @PathVariable Long id) {
        IBAAttribute attr = ibaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IBAAttribute", "id", id));
        if (!attr.getPartId().equals(partId)) {
            throw new BusinessException("IBA attribute does not belong to this part");
        }
        attr.setIsDeleted(true);
        ibaRepository.save(attr);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.DELETED).data(null).build());
    }

    private void verifyPartExists(Long partId) {
        if (!partRepository.existsById(partId)) {
            throw new ResourceNotFoundException("Part", "id", partId);
        }
    }

    @Data
    public static class IBARequest {
        private String attributeName;
        private String attributeValue;
        private String attributeType;
        private String unit;
        private String description;
    }
}
