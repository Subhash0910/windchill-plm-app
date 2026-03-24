package com.windchill.repository;

import com.windchill.domain.entity.ChangeOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChangeOrderItemRepository extends JpaRepository<ChangeOrderItem, Long> {

    List<ChangeOrderItem> findByChangeRequestIdOrderByIdAsc(Long changeRequestId);

    List<ChangeOrderItem> findByOriginalPartId(Long originalPartId);

    List<ChangeOrderItem> findByNewPartId(Long newPartId);
}
