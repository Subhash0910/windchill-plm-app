package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.PartSubstitute;
import com.windchill.repository.PartRepository;
import com.windchill.repository.PartSubstituteRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PartSubstituteController {

    private final PartSubstituteRepository substituteRepository;
    private final PartRepository partRepository;

    @GetMapping("/api/v1/plm/parts/{partId}/substitutes")
    public ResponseEntity<ApiResponse<?>> list(@PathVariable Long partId) {
        verifyPartExists(partId);
        List<PartSubstitute> subs = substituteRepository.findByPartIdAndIsDeletedFalseOrderByRankAscIdAsc(partId);

        // Enrich with substitute part details
        List<Long> subIds = subs.stream().map(PartSubstitute::getSubstitutePartId).distinct().collect(Collectors.toList());
        Map<Long, Part> partMap = partRepository.findAllById(subIds).stream()
                .collect(Collectors.toMap(Part::getId, p -> p));

        List<SubstituteDto> dtos = subs.stream().map(s -> {
            Part subPart = partMap.get(s.getSubstitutePartId());
            return SubstituteDto.from(s, subPart);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(dtos).build());
    }

    @PostMapping("/api/v1/plm/parts/{partId}/substitutes")
    public ResponseEntity<ApiResponse<?>> create(@PathVariable Long partId, @RequestBody SubstituteRequest req) {
        verifyPartExists(partId);
        if (req.getSubstitutePartId() == null) {
            throw new BusinessException("substitutePartId is required");
        }
        if (partId.equals(req.getSubstitutePartId())) {
            throw new BusinessException("A part cannot substitute itself");
        }
        if (!partRepository.existsById(req.getSubstitutePartId())) {
            throw new ResourceNotFoundException("Part", "id", req.getSubstitutePartId());
        }
        if (substituteRepository.existsByPartIdAndSubstitutePartIdAndIsDeletedFalse(partId, req.getSubstitutePartId())) {
            throw new BusinessException("Substitute already defined for this part");
        }

        PartSubstitute sub = new PartSubstitute();
        sub.setPartId(partId);
        sub.setSubstitutePartId(req.getSubstitutePartId());
        sub.setSubstituteType(req.getSubstituteType() != null ? req.getSubstituteType() : "SUBSTITUTE");
        sub.setRank(req.getRank() != null ? req.getRank() : 1);
        sub.setNote(req.getNote());
        PartSubstitute saved = substituteRepository.save(sub);

        Part subPart = partRepository.findById(saved.getSubstitutePartId()).orElse(null);
        log.info("Part substitute added: partId={} substitutePartId={}", partId, req.getSubstitutePartId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(SubstituteDto.from(saved, subPart)).build());
    }

    @DeleteMapping("/api/v1/plm/parts/{partId}/substitutes/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long partId, @PathVariable Long id) {
        PartSubstitute sub = substituteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PartSubstitute", "id", id));
        if (!sub.getPartId().equals(partId)) {
            throw new BusinessException("Substitute does not belong to this part");
        }
        sub.setIsDeleted(true);
        substituteRepository.save(sub);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.DELETED).data(null).build());
    }

    private void verifyPartExists(Long partId) {
        if (!partRepository.existsById(partId)) {
            throw new ResourceNotFoundException("Part", "id", partId);
        }
    }

    @Data
    public static class SubstituteRequest {
        private Long substitutePartId;
        private String substituteType;
        private Integer rank;
        private String note;
    }

    @Data
    public static class SubstituteDto {
        private Long id;
        private Long partId;
        private Long substitutePartId;
        private String substituteType;
        private Integer rank;
        private String note;
        private SubstitutePartInfo substitutePart;

        public static SubstituteDto from(PartSubstitute s, Part p) {
            SubstituteDto dto = new SubstituteDto();
            dto.id = s.getId();
            dto.partId = s.getPartId();
            dto.substitutePartId = s.getSubstitutePartId();
            dto.substituteType = s.getSubstituteType();
            dto.rank = s.getRank();
            dto.note = s.getNote();
            if (p != null) {
                dto.substitutePart = new SubstitutePartInfo();
                dto.substitutePart.id = p.getId();
                dto.substitutePart.partNumber = p.getPartNumber();
                dto.substitutePart.name = p.getName();
                dto.substitutePart.revision = p.getRevision();
                dto.substitutePart.lifecycleState = p.getLifecycleState() != null ? p.getLifecycleState().name() : null;
            }
            return dto;
        }
    }

    @Data
    public static class SubstitutePartInfo {
        private Long id;
        private String partNumber;
        private String name;
        private String revision;
        private String lifecycleState;
    }
}
