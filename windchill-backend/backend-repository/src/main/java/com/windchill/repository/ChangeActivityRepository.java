package com.windchill.repository;

import com.windchill.domain.entity.ChangeActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChangeActivityRepository extends JpaRepository<ChangeActivity, Long> {
    List<ChangeActivity> findByEcoIdOrderByCreatedAtAsc(Long ecoId);
    List<ChangeActivity> findByAssigneeOrderByDueDateAsc(String assignee);
}
