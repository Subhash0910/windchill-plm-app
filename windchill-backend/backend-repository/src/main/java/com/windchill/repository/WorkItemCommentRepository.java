package com.windchill.repository;

import com.windchill.domain.entity.WorkItemComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkItemCommentRepository extends JpaRepository<WorkItemComment, Long> {

    List<WorkItemComment> findByPromotionRequestIdAndIsDeletedFalseOrderByCreatedAtAsc(Long promotionRequestId);
}
