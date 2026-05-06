package com.windchill.repository;

import com.windchill.domain.entity.ChangeTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChangeTaskRepository extends JpaRepository<ChangeTask, Long> {
    List<ChangeTask> findByChangeOrderIdAndIsDeletedFalseOrderByCreatedAtAsc(Long changeOrderId);
    List<ChangeTask> findByAssigneeUserIdAndIsDeletedFalseOrderByDueDateAsc(Long assigneeUserId);
    List<ChangeTask> findByAssigneeUserIdAndStatusAndIsDeletedFalse(Long assigneeUserId, ChangeTask.TaskStatus status);
    long countByChangeOrderIdAndIsDeletedFalse(Long changeOrderId);
    long countByChangeOrderIdAndStatusAndIsDeletedFalse(Long changeOrderId, ChangeTask.TaskStatus status);
}
