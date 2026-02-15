package com.windchill.service.plm;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BomServiceImpl implements IBomService {

    private final BomLineRepository bomLineRepository;
    private final PartRepository partRepository;
    private final IAuditService auditService;

    @Override
    public BomLine addLine(Long parentPartId, Long childPartId, BigDecimal quantity, String unit, String findNumber, Integer sortOrder, String note) {
        if (parentPartId == null || childPartId == null) {
            throw new BusinessException("parentPartId and childPartId are required");
        }
        if (parentPartId.equals(childPartId)) {
            throw new BusinessException("A part cannot use itself in BOM");
        }

        Part parent = partRepository.findById(parentPartId)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", parentPartId));
        Part child = partRepository.findById(childPartId)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", childPartId));

        if (!parent.getContextId().equals(child.getContextId())) {
            throw new BusinessException("Parent and child must be in the same context");
        }

        if (bomLineRepository.existsByParentPartIdAndChildPartIdAndIsDeletedFalse(parentPartId, childPartId)) {
            throw new BusinessException("BOM line already exists for this parent/child");
        }

        BomLine line = new BomLine();
        line.setParentPartId(parentPartId);
        line.setChildPartId(childPartId);
        line.setQuantity(quantity == null ? BigDecimal.ONE : quantity);
        line.setUnit(unit == null || unit.isBlank() ? "EA" : unit);
        line.setFindNumber(findNumber);
        line.setSortOrder(sortOrder);
        line.setLineNote(note);

        BomLine saved = bomLineRepository.save(line);
        auditService.log(PlmEntityTypeEnum.BOM_LINE, saved.getId(), "CREATE", "BOM line created parent=" + parentPartId + " child=" + childPartId);
        auditService.log(PlmEntityTypeEnum.PART, parentPartId, "BOM_ADD", "Added child partId=" + childPartId);
        log.info("BOM line added: parent={} child={}", parentPartId, childPartId);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BomLine> listBom(Long parentPartId) {
        return bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(parentPartId);
    }

    @Override
    public void deleteLine(Long bomLineId) {
        BomLine line = bomLineRepository.findById(bomLineId)
                .orElseThrow(() -> new ResourceNotFoundException("BomLine", "id", bomLineId));
        line.setIsDeleted(true);
        bomLineRepository.save(line);
        auditService.log(PlmEntityTypeEnum.BOM_LINE, bomLineId, "DELETE", "BOM line deleted");
        auditService.log(PlmEntityTypeEnum.PART, line.getParentPartId(), "BOM_REMOVE", "Removed child partId=" + line.getChildPartId());
    }
}
