package com.windchill.change.service;

import com.windchill.change.domain.ChangeNotice;
import com.windchill.change.domain.ChangeNoticeStatus;
import com.windchill.change.domain.ChangeTask;
import com.windchill.change.domain.ChangeTaskType;
import com.windchill.change.repository.ChangeNoticeRepository;
import com.windchill.change.repository.ChangeRequestRepository;
import com.windchill.change.repository.ChangeTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChangeRobotService {

    private final ChangeNoticeRepository changeNoticeRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final ChangeTaskRepository changeTaskRepository;

    public ChangeRobotService(ChangeNoticeRepository changeNoticeRepository,
                             ChangeRequestRepository changeRequestRepository,
                             ChangeTaskRepository changeTaskRepository) {
        this.changeNoticeRepository = changeNoticeRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.changeTaskRepository = changeTaskRepository;
    }

    @Transactional
    public ChangeNotice onEcrFullyApproved(Long ecrId) {
        // Idempotent: one ECN per ECR
        return changeNoticeRepository.findByOriginEcrId(ecrId)
                .orElseGet(() -> createEcnAndImplementationTask(ecrId));
    }

    private ChangeNotice createEcnAndImplementationTask(Long ecrId) {
        String createdBy = changeRequestRepository.findById(ecrId)
                .map(r -> r.getCreatedBy())
                .orElse("system");

        ChangeNotice ecn = new ChangeNotice();
        ecn.setOriginEcrId(ecrId);
        ecn.setStatus(ChangeNoticeStatus.DRAFT);
        ecn.setCreatedBy(createdBy);
        ChangeNotice saved = changeNoticeRepository.save(ecn);
        saved.setNumber(formatEcnNumber(saved.getId()));
        saved = changeNoticeRepository.save(saved);

        ChangeTask impl = new ChangeTask();
        impl.setChangeNoticeId(saved.getId());
        impl.setType(ChangeTaskType.IMPLEMENT);
        impl.setAssignee(createdBy);
        changeTaskRepository.save(impl);

        return saved;
    }

    private String formatEcnNumber(Long id) {
        return "ECN-" + String.format("%06d", id);
    }
}
