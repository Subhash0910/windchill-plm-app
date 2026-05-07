package com.windchill.repository;

import com.windchill.domain.entity.PartSubstitute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartSubstituteRepository extends JpaRepository<PartSubstitute, Long> {
    List<PartSubstitute> findByPartIdAndIsDeletedFalseOrderByRankAscIdAsc(Long partId);
    boolean existsByPartIdAndSubstitutePartIdAndIsDeletedFalse(Long partId, Long substitutePartId);
}
