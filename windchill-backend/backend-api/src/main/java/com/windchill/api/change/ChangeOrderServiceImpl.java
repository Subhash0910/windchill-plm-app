package com.windchill.api.change;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChangeOrderServiceImpl implements ChangeOrderService {

    private final ChangeOrderRepository repo;

    // ── valid state transitions ──────────────────────────────────────────
    private static final java.util.Map<ChangeOrder.State, Set<ChangeOrder.State>> TRANSITIONS =
        java.util.Map.of(
            ChangeOrder.State.DRAFT,          Set.of(ChangeOrder.State.OPEN, ChangeOrder.State.CANCELLED),
            ChangeOrder.State.OPEN,           Set.of(ChangeOrder.State.IN_REVIEW, ChangeOrder.State.CANCELLED),
            ChangeOrder.State.IN_REVIEW,      Set.of(ChangeOrder.State.APPROVED, ChangeOrder.State.OPEN, ChangeOrder.State.CANCELLED),
            ChangeOrder.State.APPROVED,       Set.of(ChangeOrder.State.IMPLEMENTING, ChangeOrder.State.CANCELLED),
            ChangeOrder.State.IMPLEMENTING,   Set.of(ChangeOrder.State.COMPLETED, ChangeOrder.State.CANCELLED),
            ChangeOrder.State.COMPLETED,      Set.of(),
            ChangeOrder.State.CANCELLED,      Set.of()
        );

    @Override
    @Transactional
    public ChangeOrderDto create(ChangeOrderCreateRequest req, String currentUser) {
        String ecoNumber = generateEcoNumber(req.getContextId());
        ChangeOrder eco = ChangeOrder.builder()
            .ecoNumber(ecoNumber)
            .title(req.getTitle())
            .description(req.getDescription())
            .priority(req.getPriority() != null
                ? ChangeOrder.Priority.valueOf(req.getPriority().toUpperCase())
                : ChangeOrder.Priority.MEDIUM)
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
    public ChangeOrderDto getById(Long id) {
        return ChangeOrderDto.from(findOrThrow(id));
    }

    @Override
    public List<ChangeOrderDto> listByContext(Long contextId) {
        return repo.findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(contextId)
            .stream().map(ChangeOrderDto::from).collect(Collectors.toList());
    }

    @Override
    public List<ChangeOrderDto> listByEcr(Long ecrId) {
        return repo.findByEcrIdAndIsDeletedFalse(ecrId)
            .stream().map(ChangeOrderDto::from).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChangeOrderDto promote(Long id, String targetState, String currentUser) {
        ChangeOrder eco = findOrThrow(id);
        ChangeOrder.State target;
        try {
            target = ChangeOrder.State.valueOf(targetState.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown state: " + targetState);
        }
        Set<ChangeOrder.State> allowed = TRANSITIONS.getOrDefault(eco.getState(), Set.of());
        if (!allowed.contains(target)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
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

    // ── helpers ──────────────────────────────────────────────────────────
    private ChangeOrder findOrThrow(Long id) {
        return repo.findByIdAndIsDeletedFalse(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ChangeOrder " + id + " not found"));
    }

    private String generateEcoNumber(Long contextId) {
        long count = repo.findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(contextId).size() + 1;
        return String.format("ECO-%05d", count);
    }
}
