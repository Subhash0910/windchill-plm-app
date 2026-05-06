package com.windchill.service.change;

import com.windchill.common.exception.BusinessException;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.ChangeOrder;
import com.windchill.repository.ChangeOrderRepository;
import com.windchill.repository.UserRepository;
import com.windchill.service.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChangeOrderServiceImpl implements IChangeOrderService {

    private final ChangeOrderRepository repo;
    private final INotificationService notificationService;
    private final UserRepository userRepo;

    private void notify(String username, String title, String message, ChangeOrder eco) {
        if (username == null || username.isBlank()) return;
        try {
            userRepo.findByUsername(username).ifPresent(u ->
                notificationService.create(u.getId(), title, message,
                    "ECO", "CHANGE_ORDER", eco.getId(), eco.getEcoNumber())
            );
        } catch (Exception ex) {
            log.warn("ECO notification failed (non-fatal): {}", ex.getMessage());
        }
    }

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
        ChangeOrder saved = repo.save(eco);
        if (saved.getAssignedTo() != null && !Objects.equals(saved.getAssignedTo(), currentUser)) {
            notify(saved.getAssignedTo(),
                "ECO assigned: " + saved.getEcoNumber(),
                "You have been assigned to " + saved.getTitle(), saved);
        }
        return ChangeOrderDto.from(saved);
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

        boolean isOwner    = Objects.equals(eco.getCreatedBy(), currentUser);
        boolean isAssignee = Objects.equals(eco.getAssignedTo(), currentUser);
        if (!isOwner && !isAssignee) {
            throw new BusinessException("Not authorized to promote ECO " + eco.getEcoNumber());
        }

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
        ChangeOrder saved = repo.save(eco);

        // Notify creator + assignee on state change (skip self)
        String title = "ECO " + saved.getEcoNumber() + " → " + target.name();
        String message = saved.getTitle() + " is now " + target.name().replace("_", " ");
        if (!Objects.equals(saved.getCreatedBy(), currentUser)) {
            notify(saved.getCreatedBy(), title, message, saved);
        }
        if (saved.getAssignedTo() != null && !Objects.equals(saved.getAssignedTo(), currentUser)) {
            notify(saved.getAssignedTo(), title, message, saved);
        }
        return ChangeOrderDto.from(saved);
    }

    @Override
    @Transactional
    public ChangeOrderDto linkAiResult(Long id, Double riskScore, Double confidence,
                                       Double costEstimate, String currentUser) {
        ChangeOrder eco = findOrThrow(id);
        eco.setAiRiskScore(riskScore);
        eco.setAiConfidence(confidence);
        eco.setAiCostEstimate(costEstimate);
        eco.setUpdatedBy(currentUser);
        return ChangeOrderDto.from(repo.save(eco));
    }

    @Override
    @Transactional
    public void delete(Long id, String currentUser) {
        ChangeOrder eco = findOrThrow(id);
        if (!Objects.equals(eco.getCreatedBy(), currentUser)) {
            throw new BusinessException("Not authorized to delete ECO " + eco.getEcoNumber());
        }
        eco.setIsDeleted(true);
        eco.setUpdatedBy(currentUser);
        repo.save(eco);
    }

    private ChangeOrder findOrThrow(Long id) {
        return repo.findByIdAndIsDeletedFalse(id)
            .orElseThrow(() -> new ResourceNotFoundException("ChangeOrder not found"));
    }

    private String generateEcoNumber(Long contextId) {
        long count = repo.countByContextIdAndIsDeletedFalse(contextId) + 1;
        return String.format("ECO-%05d", count);
    }
}
