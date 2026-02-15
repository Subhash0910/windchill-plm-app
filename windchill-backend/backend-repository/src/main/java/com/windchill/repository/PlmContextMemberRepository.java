package com.windchill.repository;

import com.windchill.domain.entity.PlmContextMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlmContextMemberRepository extends JpaRepository<PlmContextMember, Long> {

    boolean existsByContextIdAndUserIdAndIsDeletedFalse(Long contextId, Long userId);

    Optional<PlmContextMember> findByContextIdAndUserIdAndIsDeletedFalse(Long contextId, Long userId);

    Optional<PlmContextMember> findByContextIdAndUserId(Long contextId, Long userId);

    List<PlmContextMember> findByUserIdAndIsDeletedFalse(Long userId);

    List<PlmContextMember> findByContextIdAndIsDeletedFalse(Long contextId);
}
