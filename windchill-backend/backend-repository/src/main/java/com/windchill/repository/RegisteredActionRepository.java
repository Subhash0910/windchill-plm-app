package com.windchill.repository;

import com.windchill.domain.entity.RegisteredAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for RegisteredAction — the Windchill Action Framework's
 * action registry persistence.
 */
public interface RegisteredActionRepository extends JpaRepository<RegisteredAction, Long> {

    /** Find all actions applicable to a given entity type. */
    List<RegisteredAction> findByTargetType(String targetType);

    /** Find a single action by its unique name. */
    Optional<RegisteredAction> findByActionName(String actionName);

    /** Find all actions in a category group. */
    List<RegisteredAction> findByCategory(String category);

    /** Find all actions for a target type, ordered by sort order. */
    List<RegisteredAction> findByTargetTypeOrderBySortOrderAsc(String targetType);

    /** Find by action type (TOOLBAR, MENU, CONTEXT_MENU, WIZARD, TAB). */
    List<RegisteredAction> findByActionType(String actionType);

    /** Find actions for a target type and category. */
    List<RegisteredAction> findByTargetTypeAndCategory(String targetType, String category);
}
