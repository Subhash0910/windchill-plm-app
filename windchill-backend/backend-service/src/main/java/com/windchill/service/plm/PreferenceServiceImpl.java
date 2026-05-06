package com.windchill.service.plm;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.Preference;
import com.windchill.repository.PreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PreferenceServiceImpl implements IPreferenceService {

    private final PreferenceRepository preferenceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Preference> listByCategory(String category) {
        if (category == null || category.isBlank()) {
            return preferenceRepository.findAllByIsDeletedFalse();
        }
        return preferenceRepository.findByCategoryAndIsDeletedFalse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Preference> listByScope(String scope) {
        return preferenceRepository.findByScopeAndIsDeletedFalse(scope);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Preference> listAll() {
        return preferenceRepository.findAllByIsDeletedFalse();
    }

    @Override
    @Transactional(readOnly = true)
    public String resolveValue(String prefKey, Long contextId, Long userId) {
        return preferenceRepository.resolveValue(prefKey, contextId, userId);
    }

    @Override
    public Preference createOrUpdate(Preference preference) {
        if (preference.getPrefKey() == null || preference.getPrefKey().isBlank()) {
            throw new BusinessException("prefKey is required");
        }
        if (preference.getScope() == null || preference.getScope().isBlank()) {
            throw new BusinessException("scope is required");
        }

        // Check for existing preference with same key + scope + scopeId
        if (preference.getId() == null) {
            Long scopeId = preference.getScopeId();
            String scope = preference.getScope();

            Optional<Preference> existing;
            if (scopeId != null) {
                existing = preferenceRepository.findByPrefKeyAndScopeAndScopeIdAndIsDeletedFalse(
                        preference.getPrefKey(), scope, scopeId);
            } else {
                existing = preferenceRepository.findByPrefKeyAndScopeAndIsDeletedFalse(
                        preference.getPrefKey(), scope);
            }
            if (existing.isPresent()) {
                Preference e = existing.get();
                e.setPrefValue(preference.getPrefValue());
                if (preference.getPrefType() != null) e.setPrefType(preference.getPrefType());
                if (preference.getCategory() != null) e.setCategory(preference.getCategory());
                if (preference.getDisplayName() != null) e.setDisplayName(preference.getDisplayName());
                if (preference.getDescription() != null) e.setDescription(preference.getDescription());
                if (preference.getIsEncrypted() != null) e.setIsEncrypted(preference.getIsEncrypted());
                log.info("Updated preference: key={}, scope={}, scopeId={}",
                        preference.getPrefKey(), scope, scopeId);
                return preferenceRepository.save(e);
            }
        }

        Preference saved = preferenceRepository.save(preference);
        log.info("Created preference: key={}, scope={}", saved.getPrefKey(), saved.getScope());
        return saved;
    }

    @Override
    public void deletePreference(Long id) {
        Preference pref = preferenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Preference", "id", id));
        pref.setIsDeleted(true);
        preferenceRepository.save(pref);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getAllResolved(Long contextId, Long userId) {
        Map<String, String> resolved = new LinkedHashMap<>();
        List<Preference> all = preferenceRepository.findAllByIsDeletedFalse();
        for (Preference pref : all) {
            String resolvedVal = preferenceRepository.resolveValue(pref.getPrefKey(), contextId, userId);
            if (resolvedVal != null) {
                resolved.put(pref.getPrefKey(), resolvedVal);
            }
        }
        return resolved;
    }
}
