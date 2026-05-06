package com.windchill.repository;

import com.windchill.domain.entity.ObjectTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObjectTemplateRepository extends JpaRepository<ObjectTemplate, Long> {

    List<ObjectTemplate> findByTargetTypeAndIsDeletedFalse(String targetType);

    List<ObjectTemplate> findByTargetTypeAndIsPublicTrueAndIsDeletedFalse(String targetType);

    List<ObjectTemplate> findByTargetTypeAndOwnerIdAndIsDeletedFalse(String targetType, Long ownerId);

    List<ObjectTemplate> findAllByIsDeletedFalse();
}
