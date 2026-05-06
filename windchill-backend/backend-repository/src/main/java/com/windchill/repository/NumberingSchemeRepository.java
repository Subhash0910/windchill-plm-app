package com.windchill.repository;

import com.windchill.domain.entity.NumberingScheme;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NumberingSchemeRepository extends JpaRepository<NumberingScheme, Long> {

    Optional<NumberingScheme> findByTargetTypeAndIsDefaultTrueAndIsActiveTrue(String targetType);

    List<NumberingScheme> findByTargetTypeAndIsDeletedFalse(String targetType);

    List<NumberingScheme> findAllByIsDeletedFalse();
}
