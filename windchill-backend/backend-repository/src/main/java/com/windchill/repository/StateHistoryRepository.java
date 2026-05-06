package com.windchill.repository;

import com.windchill.domain.entity.StateHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StateHistoryRepository extends JpaRepository<StateHistory, Long> {

    List<StateHistory> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    Page<StateHistory> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId, Pageable pageable);

    List<StateHistory> findByEntityTypeAndEntityId(String entityType, Long entityId);
}
