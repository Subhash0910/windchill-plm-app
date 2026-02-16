package com.windchill.repository;

import com.windchill.common.enums.PromotionRequestStatusEnum;
import com.windchill.domain.entity.PromotionRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PromotionRequestRepository extends JpaRepository<PromotionRequest, Long> {

    Optional<PromotionRequest> findFirstByPartIdAndStatusInOrderByCreatedAtDesc(Long partId, List<PromotionRequestStatusEnum> statuses);
}
