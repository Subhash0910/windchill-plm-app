package com.windchill.repository;

import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectCode(String projectCode);

    List<Project> findByManagerIdAndIsDeletedFalse(Long managerId);

    List<Project> findByStatusAndIsDeletedFalse(StatusEnum status);

    @Query("SELECT p FROM Project p WHERE p.isDeleted = false ORDER BY p.createdAt DESC")
    List<Project> findAllActive();

    @Query("SELECT p FROM Project p WHERE p.projectName LIKE %:name% AND p.isDeleted = false")
    List<Project> findByProjectNameContaining(@Param("name") String name);
}
