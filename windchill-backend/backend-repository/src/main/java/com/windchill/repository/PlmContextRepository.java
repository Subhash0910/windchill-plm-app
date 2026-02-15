package com.windchill.repository;

import com.windchill.domain.entity.PlmContext;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlmContextRepository extends JpaRepository<PlmContext, Long> {
    Optional<PlmContext> findByCode(String code);
    boolean existsByCode(String code);
}
