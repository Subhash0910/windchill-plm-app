package com.windchill.repository;

import com.windchill.domain.entity.AccessControlRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for AccessControlRule entities.
 *
 * Windchill ACL evaluation fetches rules by target (type + optional id) and
 * then filters in-memory by principal to honor priority ordering.
 */
@Repository
public interface AccessControlRuleRepository extends JpaRepository<AccessControlRule, Long> {

    /** All rules for a specific target type, ordered by priority descending. */
    List<AccessControlRule> findByTargetTypeOrderByPriorityDesc(String targetType);

    /** Rules for a specific target type AND specific object id. */
    List<AccessControlRule> findByTargetTypeAndTargetIdOrderByPriorityDesc(String targetType, Long targetId);

    /** Rules for a specific target type with null targetId (global rules). */
    List<AccessControlRule> findByTargetTypeAndTargetIdIsNullOrderByPriorityDesc(String targetType);

    /** Rules assigned to a specific user. */
    List<AccessControlRule> findByPrincipalTypeAndPrincipalIdOrderByPriorityDesc(String principalType, Long principalId);

    /** Convenience: global + object-specific rules for targetType and optional targetId. */
    default List<AccessControlRule> findEffectiveRules(String targetType, Long targetId) {
        List<AccessControlRule> rules = findByTargetTypeAndTargetIdOrderByPriorityDesc(targetType, targetId);
        rules.addAll(findByTargetTypeAndTargetIdIsNullOrderByPriorityDesc(targetType));
        rules.sort((a, b) -> Integer.compare(b.getPriority(), a.getPriority()));
        return rules;
    }
}
