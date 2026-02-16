package com.windchill.repository;

import com.windchill.common.enums.WorkItemStatusEnum;
import com.windchill.domain.entity.WorkItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkItemRepository extends JpaRepository<WorkItem, Long> {

    List<WorkItem> findByAssigneeUserIdAndStatusAndIsDeletedFalseOrderByDueAtAsc(Long assigneeUserId, WorkItemStatusEnum status);

    List<WorkItem> findByPromotionRequestIdAndIsDeletedFalse(Long promotionRequestId);

    Optional<WorkItem> findByIdAndIsDeletedFalse(Long id);
}
