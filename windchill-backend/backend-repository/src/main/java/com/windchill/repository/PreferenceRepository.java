package com.windchill.repository;

import com.windchill.domain.entity.Preference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreferenceRepository extends JpaRepository<Preference, Long> {

    List<Preference> findByScopeAndScopeId(String scope, Long scopeId);

    List<Preference> findByCategoryAndIsDeletedFalse(String category);

    List<Preference> findByScopeAndIsDeletedFalse(String scope);

    Optional<Preference> findByPrefKeyAndScopeAndScopeIdAndIsDeletedFalse(String prefKey, String scope, Long scopeId);

    Optional<Preference> findByPrefKeyAndScopeAndIsDeletedFalse(String prefKey, String scope);

    List<Preference> findByCategoryAndScopeAndIsDeletedFalse(String category, String scope);

    List<Preference> findAllByIsDeletedFalse();

    /**
     * Resolve a preference value using the hierarchy: USER > CONTEXT > SYSTEM
     */
    default String resolveValue(String prefKey, Long contextId, Long userId) {
        // 1. Check USER level
        if (userId != null) {
            Optional<Preference> userPref = findByPrefKeyAndScopeAndScopeIdAndIsDeletedFalse(prefKey, "USER", userId);
            if (userPref.isPresent()) return userPref.get().getPrefValue();
        }
        // 2. Check CONTEXT level
        if (contextId != null) {
            Optional<Preference> ctxPref = findByPrefKeyAndScopeAndScopeIdAndIsDeletedFalse(prefKey, "CONTEXT", contextId);
            if (ctxPref.isPresent()) return ctxPref.get().getPrefValue();
        }
        // 3. Fall back to SYSTEM
        Optional<Preference> sysPref = findByPrefKeyAndScopeAndIsDeletedFalse(prefKey, "SYSTEM");
        return sysPref.map(Preference::getPrefValue).orElse(null);
    }
}
