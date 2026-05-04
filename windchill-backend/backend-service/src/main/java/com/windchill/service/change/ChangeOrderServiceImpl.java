package com.windchill.service.change;

import com.windchill.common.exception.BusinessException;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.ChangeOrder;
import com.windchill.repository.ChangeOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChangeOrderServiceImpl implements IChangeOrderService {

    private final ChangeOrderRepository repo;

    private static final Map<ChangeOrder.State, Set<ChangeOrder.State>> TRANSITIONS = Map.of(
        ChangeOrder.State.DRAFT,        Set.of(ChangeOrder.State.OPEN, ChangeOrder.State.CANCELLED),
        ChangeOrder.State.OPEN,         Set.of(ChangeOrder.State.IN_REVIEW, ChangeOrder.State.CANCELLED),
        ChangeOrder.State.IN_REVIEW,    Set.of(ChangeOrder.State.APPROVED, ChangeOrder.State.OPEN, ChangeOrder.State.CANCELLED),
        ChangeOrder.State.APPROVED,     Set.of(ChangeOrder.State.IMPLEMENTING, ChangeOrder.State.CANCELLED),
        ChangeOrder.State.IMPLEMENTING, Set.of(ChangeOrder.State.COMPLETED, ChangeOrder.State.CANCELLED),
        ChangeOrder.State.COMPLETED,    Set.of(),
        ChangeOrder.State.CANCELLED,    Set.of()
    );

    @Override
    @Transactional
    public ChangeOrderDto create(ChangeOrderCreateRequest req, String currentUser) {
        String ecoNumber = generateEcoNumber(req.getContextId());
        ChangeOrder eco = ChangeOrder.builder()
            .ecoNumber(ecoNumber)
            .title(req.getTitle())
            .description(req.getDescription())
            .priority(req.getPriority() != null ? req.getPriority() : ChangeOrder.Priority.MEDIUM)
            .contextId(req.getContextId())
            .ecrId(req.getEcrId())
            .assignedTo(req.getAssignedTo())
            .dueDate(req.getDueDate())
            .state(ChangeOrder.State.DRAFT)
            .isDeleted(false)
            .createdBy(currentUser)
            .updatedBy(currentUser)
            .build();
        return ChangeOrderDto.from(repo.save(eco));
    }

    @Override
    @Transactional(readOnly = true)
    public ChangeOrderDto getById(Long id) {
        return ChangeOrderDto.from(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeOrderDto> listByContext(Long contextId) {
        return repo.findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(contextId)
            .stream().map(ChangeOrderDto::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeOrderDto> listByEcr(Long ecrId) {
        return repo.findByEcrIdAndIsDeletedFalse(ecrId)
            .stream().map(ChangeOrderDto::from).toList();
    }

    @Override
    @Transactional
    public ChangeOrderDto promote(Long id, String targetState, String currentUser) {
        ChangeOrder eco = findOrThrow(id);
        ChangeOrder.State target;
        try {
            target = ChangeOrder.State.valueOf(targetState.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Unknown state: " + targetState);
        }
        Set<ChangeOrder.State> allowed = TRANSITIONS.getOrDefault(eco.getState(), Set.of());
        if (!allowed.contains(target)) {
            throw new BusinessException(
                "Cannot transition ECO from " + eco.getState() + " to " + target);
        }
        eco.setState(target);
        eco.setUpdatedBy(currentUser);
        return ChangeOrderDto.from(repo.save(eco));
    }

    @Override
    @Transactional
    public ChangeOrderDto linkAiResult(Long id, Double riskScore, Double confidence, Double costEstimate) {
        ChangeOrder eco = findOrThrow(id);
        eco.setAiRiskScore(riskScore);
        eco.setAiConfidence(confidence);
        eco.setAiCostEstimate(costEstimate);
        return ChangeOrderDto.from(repo.save(eco));
    }

    @Override
    @Transactional
    public void delete(Long id, String currentUser) {
        ChangeOrder eco = findOrThrow(id);
        eco.setIsDeleted(true);
        eco.setUpdatedBy(currentUser);
        repo.save(eco);
    }

    private ChangeOrder findOrThrow(Long id) {
        return repo.findByIdAndIsDeletedFalse(id)
            .orElseThrow(() -> new ResourceNotFoundException("ChangeOrder " + id + " not found"));
    }

    private String generateEcoNumber(Long contextId) {
        long count = repo.countByContextIdAndIsDeletedFalse(contextId) + 1;
        return String.format("ECO-%05d", count);
    }
}
