package com.windchill.repository;

import com.windchill.domain.entity.IbaAttributeDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for IbaAttributeDefinition — Windchill IBA soft-type
 * attribute definitions.
 */
public interface IbaAttributeDefinitionRepository
        extends JpaRepository<IbaAttributeDefinition, Long> {

    /** List active attribute definitions for a given target type. */
    List<IbaAttributeDefinition> findByTargetTypeAndIsActiveTrue(String targetType);

    /** Find a single definition by its attribute name and target type. */
    Optional<IbaAttributeDefinition> findByAttributeNameAndTargetType(
            String attributeName, String targetType);

    /** Find all definitions in a category group. */
    List<IbaAttributeDefinition> findByCategory(String category);

    /** Find all active definitions for a target type, ordered by sort order. */
    List<IbaAttributeDefinition> findByTargetTypeAndIsActiveTrueOrderBySortOrderAsc(
            String targetType);
}
