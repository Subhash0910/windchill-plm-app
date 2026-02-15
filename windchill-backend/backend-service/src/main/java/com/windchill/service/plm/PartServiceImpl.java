package com.windchill.service.plm;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.Part;
import com.windchill.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PartServiceImpl implements IPartService {

    private final PartRepository partRepository;
    private final IAuditService auditService;

    @Override
    public Part createPart(Part part) {
        if (part.getContextId() == null) {
            throw new BusinessException("contextId is required");
        }
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
        // First save: set masterId to self id
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
        return partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Part> listParts(Long contextId) {
        if (contextId == null) {
            throw new BusinessException("contextId is required");
        }
        return partRepository.findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(contextId);
    }

    @Override
    public Part updatePart(Long id, Part details) {
        Part part = getPart(id);

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

        if (from == LifecycleStateEnum.OBSOLETE) {
            throw new BusinessException("OBSOLETE parts cannot be promoted");
        }

        boolean allowed =
                (from == LifecycleStateEnum.INWORK && target == LifecycleStateEnum.UNDERREVIEW)
                        || (from == LifecycleStateEnum.UNDERREVIEW && target == LifecycleStateEnum.RELEASED)
                        || (from == LifecycleStateEnum.RELEASED && target == LifecycleStateEnum.OBSOLETE);

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

        if (released.getLifecycleState() != LifecycleStateEnum.RELEASED) {
            throw new BusinessException("Only RELEASED parts can be revised");
        }

        // Mark current as not latest
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

    private String incrementRevision(String current) {
        if (current == null || current.isBlank()) return "A";
        String c = current.trim().toUpperCase();
        // Simple A..Z then AA..AZ etc
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
