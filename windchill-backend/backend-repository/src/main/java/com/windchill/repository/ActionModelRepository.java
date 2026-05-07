package com.windchill.repository;

import com.windchill.domain.entity.ActionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActionModelRepository extends JpaRepository<ActionModel, Long> {

    List<ActionModel> findByObjectTypeAndIsEnabledTrueAndIsDeletedFalseOrderBySortOrderAscIdAsc(String objectType);

    List<ActionModel> findByIsDeletedFalseOrderByObjectTypeAscSortOrderAscIdAsc();

    boolean existsByObjectTypeAndActionNameAndIsDeletedFalse(String objectType, String actionName);
}
