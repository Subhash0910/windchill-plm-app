package com.windchill.service.workflow;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.PromotionRequestStatusEnum;
import com.windchill.common.enums.RoleEnum;
import com.windchill.common.enums.WorkItemStatusEnum;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.PlmContextMember;
import com.windchill.domain.entity.PromotionRequest;
import com.windchill.domain.entity.WorkItem;
import com.windchill.domain.entity.WorkItemComment;
import com.windchill.repository.PartRepository;
import com.windchill.repository.PlmContextMemberRepository;
import com.windchill.repository.PromotionRequestRepository;
import com.windchill.repository.WorkItemCommentRepository;
import com.windchill.repository.WorkItemRepository;
import com.windchill.service.plm.IAuditService;
import com.windchill.service.plm.security.PlmAclService;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PromotionWorkflowService {

    private final PlmAclService acl;
    private final IAuditService auditService;
    private final PartRepository partRepository;
    private final PlmContextMemberRepository memberRepository;
    private final PromotionRequestRepository promotionRequestRepository;
    private final WorkItemRepository workItemRepository;
    private final WorkItemCommentRepository commentRepository;

    /**
     * Starts a promotion request workflow for INWORK -> UNDERREVIEW.
     * Creates one WorkItem per APPROVER in the part's context (excluding requester).
     */
    public PromotionRequest startPromotionRequest(Long partId, LifecycleStateEnum target) {
        if (target != LifecycleStateEnum.UNDERREVIEW) {
            throw new BusinessException("Workflow start only supported for target=UNDERREVIEW");
        }

        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new BusinessException("Part not found"));

        // requester must be able to initiate review
        acl.requireContextRole(part.getContextId(), RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.ENGINEER);
        Long requesterUserId = acl.requireUserId();

        if (part.getLifecycleState() != LifecycleStateEnum.INWORK) {
            throw new BusinessException("Only INWORK parts can be submitted for review");
        }

        // Ensure there isn't already an active promotion request for this part
        promotionRequestRepository
                .findFirstByPartIdAndStatusInOrderByCreatedAtDesc(
                        partId,
                        List.of(PromotionRequestStatusEnum.PENDING_APPROVAL)
                )
                .ifPresent(pr -> {
                    throw new BusinessException("A promotion request is already pending for this part");
                });

        List<PlmContextMember> members = memberRepository.findByContextIdAndIsDeletedFalse(part.getContextId());
        List<Long> approverUserIds = members.stream()
                .filter(m -> m.getRole() == RoleEnum.APPROVER)
                .map(PlmContextMember::getUserId)
                .filter(uid -> !uid.equals(requesterUserId))
                .distinct()
                .collect(Collectors.toList());

        if (approverUserIds.isEmpty()) {
            throw new BusinessException("No APPROVER assigned in this context. Cannot start Promotion Request.");
        }

        // Create PromotionRequest
        PromotionRequest pr = new PromotionRequest();
        pr.setContextId(part.getContextId());
        pr.setPartId(part.getId());
        pr.setRequestedByUserId(requesterUserId);
        pr.setFromState(part.getLifecycleState());
        pr.setToState(LifecycleStateEnum.RELEASED);
        pr.setStatus(PromotionRequestStatusEnum.PENDING_APPROVAL);
        pr = promotionRequestRepository.save(pr);

        // Put part into UNDERREVIEW immediately (matches Windchill feel)
        part.setLifecycleState(LifecycleStateEnum.UNDERREVIEW);
        partRepository.save(part);

        LocalDateTime dueAt = LocalDateTime.now().plusDays(2);
        for (Long approverId : approverUserIds) {
            WorkItem wi = new WorkItem();
            wi.setPromotionRequestId(pr.getId());
            wi.setContextId(part.getContextId());
            wi.setPartId(part.getId());
            wi.setAssigneeUserId(approverId);
            wi.setStatus(WorkItemStatusEnum.PENDING);
            wi.setDueAt(dueAt);
            workItemRepository.save(wi);
        }

        auditService.log(com.windchill.common.enums.PlmEntityTypeEnum.PART, part.getId(), "PROMOTION_REQUEST", "Submitted for review (ALL approvers)");
        log.info("Promotion request {} started for part {} with {} approvers", pr.getId(), partId, approverUserIds.size());
        return pr;
    }

    public List<WorkItem> myPendingWorkItems() {
        Long me = acl.requireUserId();
        return workItemRepository.findByAssigneeUserIdAndStatusAndIsDeletedFalseOrderByDueAtAsc(me, WorkItemStatusEnum.PENDING);
    }

    public WorkItem approve(Long workItemId, String comment) {
        Long me = acl.requireUserId();
        WorkItem wi = workItemRepository.findByIdAndIsDeletedFalse(workItemId)
                .orElseThrow(() -> new BusinessException("WorkItem not found"));

        if (!wi.getAssigneeUserId().equals(me)) {
            throw new BusinessException("Not allowed: work item not assigned to you");
        }
        if (wi.getStatus() != WorkItemStatusEnum.PENDING) {
            throw new BusinessException("Work item is not pending");
        }

        // Windchill-like: still must be an APPROVER in the context at action time
        acl.requireContextRole(wi.getContextId(), RoleEnum.APPROVER);

        wi.setStatus(WorkItemStatusEnum.APPROVED);
        wi.setCompletedAt(LocalDateTime.now());
        wi.setCompletedByUserId(me);
        WorkItem saved = workItemRepository.save(wi);

        if (comment != null && !comment.isBlank()) {
            WorkItemComment c = new WorkItemComment();
            c.setPromotionRequestId(saved.getPromotionRequestId());
            c.setWorkItemId(saved.getId());
            c.setCommentedByUserId(me);
            c.setComment(comment.trim());
            commentRepository.save(c);
        }

        maybeCompletePromotion(saved.getPromotionRequestId(), me);
        return saved;
    }

    public WorkItem reject(Long workItemId, String comment) {
        Long me = acl.requireUserId();
        if (comment == null || comment.isBlank()) {
            throw new BusinessException("Rejection comment is required");
        }

        WorkItem wi = workItemRepository.findByIdAndIsDeletedFalse(workItemId)
                .orElseThrow(() -> new BusinessException("WorkItem not found"));

        if (!wi.getAssigneeUserId().equals(me)) {
            throw new BusinessException("Not allowed: work item not assigned to you");
        }
        if (wi.getStatus() != WorkItemStatusEnum.PENDING) {
            throw new BusinessException("Work item is not pending");
        }

        // Windchill-like: still must be an APPROVER in the context at action time
        acl.requireContextRole(wi.getContextId(), RoleEnum.APPROVER);

        wi.setStatus(WorkItemStatusEnum.REJECTED);
        wi.setCompletedAt(LocalDateTime.now());
        wi.setCompletedByUserId(me);
        WorkItem saved = workItemRepository.save(wi);

        WorkItemComment c = new WorkItemComment();
        c.setPromotionRequestId(saved.getPromotionRequestId());
        c.setWorkItemId(saved.getId());
        c.setCommentedByUserId(me);
        c.setComment(comment.trim());
        commentRepository.save(c);

        failPromotion(saved.getPromotionRequestId(), me);
        return saved;
    }

    private void maybeCompletePromotion(Long promotionRequestId, Long actorUserId) {
        PromotionRequest pr = promotionRequestRepository.findById(promotionRequestId)
                .orElseThrow(() -> new BusinessException("PromotionRequest not found"));

        if (pr.getStatus() != PromotionRequestStatusEnum.PENDING_APPROVAL) {
            return;
        }

        List<WorkItem> items = workItemRepository.findByPromotionRequestIdAndIsDeletedFalse(promotionRequestId);
        boolean allApproved = items.stream().allMatch(i -> i.getStatus() == WorkItemStatusEnum.APPROVED);
        if (!allApproved) return;

        try {
            // All approved: set PR approved, promote part to RELEASED
            pr.setStatus(PromotionRequestStatusEnum.APPROVED);
            pr.setCompletedAt(LocalDateTime.now());
            pr.setCompletedByUserId(actorUserId);
            promotionRequestRepository.saveAndFlush(pr);
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException e) {
            // Another approver completed/rejected concurrently; treat as idempotent.
            log.info("Promotion request {} completion already handled concurrently", promotionRequestId);
            return;
        }

        Part part = partRepository.findById(pr.getPartId())
                .orElseThrow(() -> new BusinessException("Part not found"));

        // Only allow if currently under review
        if (part.getLifecycleState() == LifecycleStateEnum.UNDERREVIEW) {
            part.setLifecycleState(LifecycleStateEnum.RELEASED);
            partRepository.save(part);
        }

        auditService.log(com.windchill.common.enums.PlmEntityTypeEnum.PART, pr.getPartId(), "PROMOTION_APPROVED", "All approvers approved. Released.");
    }

    private void failPromotion(Long promotionRequestId, Long actorUserId) {
        PromotionRequest pr = promotionRequestRepository.findById(promotionRequestId)
                .orElseThrow(() -> new BusinessException("PromotionRequest not found"));

        if (pr.getStatus() != PromotionRequestStatusEnum.PENDING_APPROVAL) {
            return;
        }

        try {
            pr.setStatus(PromotionRequestStatusEnum.REJECTED);
            pr.setCompletedAt(LocalDateTime.now());
            pr.setCompletedByUserId(actorUserId);
            promotionRequestRepository.saveAndFlush(pr);
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException e) {
            // Another approver completed concurrently; treat as idempotent.
            log.info("Promotion request {} rejection already handled concurrently", promotionRequestId);
            return;
        }

        // Cancel remaining pending work items
        List<WorkItem> items = workItemRepository.findByPromotionRequestIdAndIsDeletedFalse(promotionRequestId);
        for (WorkItem wi : items) {
            if (wi.getStatus() == WorkItemStatusEnum.PENDING) {
                wi.setStatus(WorkItemStatusEnum.CANCELLED);
                workItemRepository.save(wi);
            }
        }

        Part part = partRepository.findById(pr.getPartId())
                .orElseThrow(() -> new BusinessException("Part not found"));
        part.setLifecycleState(LifecycleStateEnum.INWORK);
        partRepository.save(part);

        auditService.log(com.windchill.common.enums.PlmEntityTypeEnum.PART, pr.getPartId(), "PROMOTION_REJECTED", "Rejected by approver. Sent back to INWORK.");
    }
}
