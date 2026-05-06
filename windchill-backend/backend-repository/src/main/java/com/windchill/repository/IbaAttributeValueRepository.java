package com.windchill.repository;

import com.windchill.domain.entity.IbaAttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for IbaAttributeValue — stores the actual values of
 * custom IBA attributes for entity instances.
 */
public interface IbaAttributeValueRepository
        extends JpaRepository<IbaAttributeValue, Long> {

    /** Find a specific attribute value for an entity. */
    Optional<IbaAttributeValue> findByEntityIdAndDefinitionId(Long entityId, Long definitionId);

    /** Get all IBA values stored for a given entity. */
    List<IbaAttributeValue> findByEntityId(Long entityId);

    /** Delete all IBA values for an entity (e.g. when the entity is deleted). */
    void deleteByEntityId(Long entityId);

    /** Find all values for a given attribute definition. */
    List<IbaAttributeValue> findByDefinitionId(Long definitionId);
}
