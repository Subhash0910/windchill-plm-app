package com.windchill.change.repository;

import com.windchill.change.domain.ChangeTask;
import com.windchill.change.domain.ChangeTaskDecision;
import com.windchill.change.domain.ChangeTaskType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChangeTaskRepository extends JpaRepository<ChangeTask, Long> {

    List<ChangeTask> findByAssigneeOrderByCreatedAtDesc(String assignee);

    List<ChangeTask> findByAssigneeAndDecisionOrderByCreatedAtDesc(String assignee, ChangeTaskDecision decision);

    List<ChangeTask> findByChangeRequestIdAndType(Long changeRequestId, ChangeTaskType type);

    List<ChangeTask> findByChangeRequestIdOrderByCreatedAtAsc(Long changeRequestId);

    boolean existsByChangeRequestIdAndTypeAndAssignee(Long changeRequestId, ChangeTaskType type, String assignee);
}
