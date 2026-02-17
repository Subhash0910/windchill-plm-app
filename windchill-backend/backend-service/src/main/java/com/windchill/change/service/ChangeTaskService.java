package com.windchill.change.service;

import com.windchill.change.domain.ChangeNotice;
import com.windchill.change.domain.ChangeNoticeStatus;
import com.windchill.change.domain.ChangeRequest;
import com.windchill.change.domain.ChangeRequestStatus;
import com.windchill.change.domain.ChangeTask;
import com.windchill.change.domain.ChangeTaskDecision;
import com.windchill.change.domain.ChangeTaskType;
import com.windchill.change.repository.ChangeNoticeRepository;
import com.windchill.change.repository.ChangeRequestRepository;
import com.windchill.change.repository.ChangeTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ChangeTaskService {

    private final ChangeTaskRepository changeTaskRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final ChangeNoticeRepository changeNoticeRepository;
    private final ChangeRequestService changeRequestService;

    public ChangeTaskService(ChangeTaskRepository changeTaskRepository,
                             ChangeRequestRepository changeRequestRepository,
                             ChangeNoticeRepository changeNoticeRepository,
                             ChangeRequestService changeRequestService) {
        this.changeTaskRepository = changeTaskRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.changeNoticeRepository = changeNoticeRepository;
        this.changeRequestService = changeRequestService;
    }

    @Transactional(readOnly = true)
    public List<ChangeTask> getMyTasks(String username, boolean pendingOnly) {
        // Use ignore-case repository methods so login principal and stored assignee can differ only by case.
        if (pendingOnly) {
            return changeTaskRepository.findByAssigneeIgnoreCaseAndDecisionOrderByCreatedAtDesc(username, ChangeTaskDecision.PENDING);
        }
        return changeTaskRepository.findByAssigneeIgnoreCaseOrderByCreatedAtDesc(username);
    }

    @Transactional
    public ChangeTask approve(Long taskId, String comment, String actor) {
        ChangeTask t = changeTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task not found"));

        if (!actor.equalsIgnoreCase(t.getAssignee())) {
            throw new ResponseStatusException(FORBIDDEN, "You are not the assignee");
        }

        if (t.getDecision() != ChangeTaskDecision.PENDING) {
            throw new ResponseStatusException(BAD_REQUEST, "Task already decided");
        }

        t.markApproved(actor, comment);
        ChangeTask saved = changeTaskRepository.save(t);

        if (t.getType() == ChangeTaskType.REVIEW && t.getChangeRequestId() != null) {
            evaluateEcrState(t.getChangeRequestId());
        }

        if (t.getType() == ChangeTaskType.IMPLEMENT && t.getChangeNoticeId() != null) {
            ChangeNotice ecn = changeNoticeRepository.findById(t.getChangeNoticeId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECN not found"));
            ecn.setStatus(ChangeNoticeStatus.DONE);
            ecn.touchUpdatedAt();
            changeNoticeRepository.save(ecn);
        }

        return saved;
    }

    @Transactional
    public ChangeTask reject(Long taskId, String comment, String actor) {
        ChangeTask t = changeTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task not found"));

        if (!actor.equalsIgnoreCase(t.getAssignee())) {
            throw new ResponseStatusException(FORBIDDEN, "You are not the assignee");
        }

        if (t.getDecision() != ChangeTaskDecision.PENDING) {
            throw new ResponseStatusException(BAD_REQUEST, "Task already decided"));
        }

        t.markRejected(actor, comment);
        ChangeTask saved = changeTaskRepository.save(t);

        if (t.getType() == ChangeTaskType.REVIEW && t.getChangeRequestId() != null) {
            ChangeRequest ecr = changeRequestRepository.findById(t.getChangeRequestId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECR not found"));
            ecr.setStatus(ChangeRequestStatus.REJECTED);
            ecr.touchUpdatedAt();
            changeRequestRepository.save(ecr);
        }

        if (t.getType() == ChangeTaskType.IMPLEMENT && t.getChangeNoticeId() != null) {
            ChangeNotice ecn = changeNoticeRepository.findById(t.getChangeNoticeId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECN not found"));
            ecn.setStatus(ChangeNoticeStatus.IN_WORK);
            ecn.touchUpdatedAt();
            changeNoticeRepository.save(ecn);
        }

        return saved;
    }

    private void evaluateEcrState(Long ecrId) {
        ChangeRequest ecr = changeRequestRepository.findById(ecrId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECR not found"));

        List<ChangeTask> reviewTasks = changeTaskRepository.findByChangeRequestIdAndType(ecrId, ChangeTaskType.REVIEW);
        boolean allApproved = !reviewTasks.isEmpty() && reviewTasks.stream().allMatch(t -> t.getDecision() == ChangeTaskDecision.APPROVED);
        boolean anyRejected = reviewTasks.stream().anyMatch(t -> t.getDecision() == ChangeTaskDecision.REJECTED);

        if (anyRejected) {
            ecr.setStatus(ChangeRequestStatus.REJECTED);
            ecr.touchUpdatedAt();
            changeRequestRepository.save(ecr);
            return;
        }

        if (allApproved) {
            ecr.setStatus(ChangeRequestStatus.APPROVED);
            ecr.touchUpdatedAt();
            changeRequestRepository.save(ecr);
            changeRequestService.onEcrDecisionFinalized(ecrId);
        }
    }
}
