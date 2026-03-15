package com.windchill.service.plm;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.common.enums.RoleEnum;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.plm.security.PlmAclService;
import com.windchill.service.workflow.PromotionWorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PartServiceImpl implements IPartService {

    private final PartRepository partRepository;
    private final BomLineRepository bomLineRepository;
    private final IAuditService auditService;
    private final PlmAclService acl;
    private final PromotionWorkflowService promotionWorkflowService;

    @Override
    public Part createPart(Part part) {
        if (part.getContextId() == null) {
            throw new BusinessException("contextId is required");
        }
        acl.requireContextRole(part.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.ENGINEER);

        if (part.getPartNumber() == null || part.getPartNumber().isBlank()) {
            throw new BusinessException("partNumber is required");
        }
        if (part.getName() == null || part.getName().isBlank()) {
            throw new BusinessException("name is required");
        }

        part.setLifecycleState(LifecycleStateEnum.INWORK);
        part.setRevision(part.getRevision() == null ? "A" : part.getRevision());
        part.setIteration(part.getIteration() == null ? 1 : part.getIteration());
        part.setIsLatest(true);

        Part saved = partRepository.save(part);
        if (saved.getMasterId() == null) {
            saved.setMasterId(saved.getId());
            saved = partRepository.save(saved);
        }

        auditService.log(PlmEntityTypeEnum.PART, saved.getId(), "CREATE", "Part created: " + saved.getPartNumber());
        log.info("Part created: {} {}.{}", saved.getPartNumber(), saved.getRevision(), saved.getIteration());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Part getPart(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", id));
        acl.requireContextMember(part.getContextId());
        return part;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Part> listParts(Long contextId) {
        if (contextId == null) {
            throw new BusinessException("contextId is required");
        }
        acl.requireContextMember(contextId);
        return partRepository.findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(contextId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Part> searchPartsByNumber(String query) {
        if (query == null || query.isBlank()) {
            log.warn("searchPartsByNumber called with empty query");
            return List.of();
        }

        log.info("Searching parts by number: {}", query);

        List<Part> allMatches = partRepository.findByPartNumberContainingIgnoreCaseAndIsDeletedFalse(query);

        List<Part> accessible = allMatches.stream()
            .filter(part -> {
                try {
                    acl.requireContextMember(part.getContextId());
                    return true;
                } catch (Exception e) {
                    return false;
                }
            })
            .collect(Collectors.toList());

        log.info("Found {} accessible parts matching '{}'", accessible.size(), query);
        return accessible;
    }

    @Override
    public Part updatePart(Long id, Part details) {
        Part part = getPart(id);
        acl.requireContextRole(part.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.ENGINEER);

        if (part.getLifecycleState() == LifecycleStateEnum.RELEASED) {
            throw new BusinessException("RELEASED parts are immutable. Create a new revision to change it.");
        }
        if (part.getLifecycleState() == LifecycleStateEnum.OBSOLETE) {
            throw new BusinessException("OBSOLETE parts are immutable.");
        }

        if (details.getName() != null) part.setName(details.getName());
        if (details.getDescription() != null) part.setDescription(details.getDescription());
        if (details.getFolderId() != null) part.setFolderId(details.getFolderId());

        Part saved = partRepository.save(part);
        auditService.log(PlmEntityTypeEnum.PART, saved.getId(), "UPDATE", "Part updated");
        return saved;
    }

    @Override
    public Part promote(Long id, LifecycleStateEnum target) {
        Part part = getPart(id);
        LifecycleStateEnum from = part.getLifecycleState();

        // For INWORK -> UNDER_REVIEW, start a Promotion Request workflow
        if (from == LifecycleStateEnum.INWORK && target == LifecycleStateEnum.UNDER_REVIEW) {
            promotionWorkflowService.startPromotionRequest(part.getId(), LifecycleStateEnum.UNDER_REVIEW);
            return getPart(part.getId());
        }

        if (target == LifecycleStateEnum.UNDER_REVIEW) {
            acl.requireContextRole(part.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.ENGINEER);
        } else if (target == LifecycleStateEnum.RELEASED) {
            acl.requireContextRole(part.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.APPROVER);
        } else if (target == LifecycleStateEnum.OBSOLETE) {
            acl.requireContextRole(part.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER);
        } else {
            acl.requireContextRole(part.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER);
        }

        if (from == LifecycleStateEnum.OBSOLETE) {
            throw new BusinessException("OBSOLETE parts cannot be promoted");
        }

        boolean allowed =
                (from == LifecycleStateEnum.INWORK      && target == LifecycleStateEnum.UNDER_REVIEW)
             || (from == LifecycleStateEnum.UNDER_REVIEW && target == LifecycleStateEnum.RELEASED)
             || (from == LifecycleStateEnum.RELEASED    && target == LifecycleStateEnum.OBSOLETE);

        if (!allowed) {
            throw new BusinessException("Invalid lifecycle transition: " + from + " -> " + target);
        }

        part.setLifecycleState(target);
        Part saved = partRepository.save(part);
        auditService.log(PlmEntityTypeEnum.PART, saved.getId(), "PROMOTE", "Lifecycle: " + from + " -> " + target);
        return saved;
    }

    @Override
    public Part revise(Long id) {
        Part released = getPart(id);
        acl.requireContextRole(released.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.ENGINEER);

        if (released.getLifecycleState() != LifecycleStateEnum.RELEASED) {
            throw new BusinessException("Only RELEASED parts can be revised");
        }

        released.setIsLatest(false);
        partRepository.save(released);

        Part newRev = new Part();
        newRev.setMasterId(released.getMasterId());
        newRev.setContextId(released.getContextId());
        newRev.setFolderId(released.getFolderId());
        newRev.setPartNumber(released.getPartNumber());
        newRev.setName(released.getName());
        newRev.setDescription(released.getDescription());
        newRev.setLifecycleState(LifecycleStateEnum.INWORK);
        newRev.setRevision(incrementRevision(released.getRevision()));
        newRev.setIteration(1);
        newRev.setIsLatest(true);

        Part saved = partRepository.save(newRev);
        auditService.log(PlmEntityTypeEnum.PART, saved.getId(), "REVISE", "New revision from partId=" + released.getId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Part> whereUsed(Long partId) {
        Part child = getPart(partId);

        List<Long> parentIds = bomLineRepository.findDistinctParentPartIdsByChildPartId(partId);
        if (parentIds == null || parentIds.isEmpty()) {
            return List.of();
        }

        List<Part> parents = partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(parentIds);

        List<Part> filtered = new ArrayList<>();
        for (Part p : parents) {
            if (p.getContextId() != null && p.getContextId().equals(child.getContextId())) {
                filtered.add(p);
            }
        }
        return filtered;
    }

    @Override
    public void deletePart(Long id) {
        Part part = getPart(id);
        acl.requireContextRole(part.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER);

        List<Long> parentIds = bomLineRepository.findDistinctParentPartIdsByChildPartId(id);
        if (parentIds != null && !parentIds.isEmpty()) {
            throw new BusinessException("Cannot delete part. It is used in " + parentIds.size() + " BOM(s). Remove from BOMs first.");
        }

        bomLineRepository.deleteByParentPartId(id);
        partRepository.deleteById(id);

        auditService.log(PlmEntityTypeEnum.PART, id, "DELETE", "Part deleted: " + part.getPartNumber());
        log.info("Part deleted: id={} partNumber={}", id, part.getPartNumber());
    }

    private String incrementRevision(String current) {
        if (current == null || current.isBlank()) return "A";
        String c = current.trim().toUpperCase();
        int i = c.length() - 1;
        char[] chars = c.toCharArray();
        while (i >= 0) {
            if (chars[i] < 'Z') {
                chars[i] = (char) (chars[i] + 1);
                return new String(chars);
            }
            chars[i] = 'A';
            i--;
        }
        return "A" + new String(chars);
    }
}
