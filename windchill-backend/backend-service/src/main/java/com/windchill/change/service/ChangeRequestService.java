package com.windchill.change.service;

import com.windchill.change.domain.ChangeRequest;
import com.windchill.change.domain.ChangeRequestStatus;
import com.windchill.change.domain.ChangeTask;
import com.windchill.change.domain.ChangeTaskType;
import com.windchill.change.repository.ChangeRequestRepository;
import com.windchill.change.repository.ChangeTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ChangeRequestService {

    private final ChangeRequestRepository changeRequestRepository;
    private final ChangeTaskRepository changeTaskRepository;
    private final ChangeRobotService changeRobotService;

    public ChangeRequestService(ChangeRequestRepository changeRequestRepository,
                               ChangeTaskRepository changeTaskRepository,
                               ChangeRobotService changeRobotService) {
        this.changeRequestRepository = changeRequestRepository;
        this.changeTaskRepository = changeTaskRepository;
        this.changeRobotService = changeRobotService;
    }

    @Transactional
    public ChangeRequest createDraft(String title, String description, String contextType, String contextId, String createdBy) {
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "title is required");
        }

        ChangeRequest ecr = new ChangeRequest();
        ecr.setTitle(title.trim());
        ecr.setDescription(description);
        ecr.setContextType(contextType);
        ecr.setContextId(contextId);
        ecr.setCreatedBy(createdBy);
        ecr.setStatus(ChangeRequestStatus.DRAFT);

        ChangeRequest saved = changeRequestRepository.save(ecr);
        saved.setNumber(formatEcrNumber(saved.getId()));
        saved.touchUpdatedAt();
        return changeRequestRepository.save(saved);
    }

    @Transactional
    public ChangeRequest submit(Long ecrId, List<String> reviewers, String submittedBy) {
        ChangeRequest ecr = changeRequestRepository.findById(ecrId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECR not found"));

        if (ecr.getStatus() != ChangeRequestStatus.DRAFT) {
            throw new ResponseStatusException(BAD_REQUEST, "Only DRAFT ECR can be submitted");
        }

        if (reviewers == null || reviewers.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "At least one reviewer is required");
        }

        ecr.setStatus(ChangeRequestStatus.SUBMITTED);
        ecr.touchUpdatedAt();
        changeRequestRepository.save(ecr);

        for (String reviewer : reviewers) {
            if (reviewer == null || reviewer.isBlank()) {
                continue;
            }
            ChangeTask t = new ChangeTask();
            t.setChangeRequestId(ecr.getId());
            t.setType(ChangeTaskType.REVIEW);
            t.setAssignee(reviewer.trim());
            changeTaskRepository.save(t);
        }

        return ecr;
    }

    @Transactional(readOnly = true)
    public ChangeRequest getById(Long ecrId) {
        return changeRequestRepository.findById(ecrId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECR not found"));
    }

    @Transactional(readOnly = true)
    public List<ChangeRequest> list(ChangeRequestStatus statusOrNull) {
        if (statusOrNull == null) {
            return changeRequestRepository.findAll();
        }
        return changeRequestRepository.findByStatusOrderByIdDesc(statusOrNull);
    }

    @Transactional
    public void onEcrDecisionFinalized(Long ecrId) {
        changeRobotService.onEcrFullyApproved(ecrId);
    }

    private String formatEcrNumber(Long id) {
        return "ECR-" + String.format("%06d", id);
    }
}
