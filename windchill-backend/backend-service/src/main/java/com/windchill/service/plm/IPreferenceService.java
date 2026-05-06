package com.windchill.service.plm;

import com.windchill.domain.entity.Preference;

import java.util.List;
import java.util.Map;

public interface IPreferenceService {
    List<Preference> listByCategory(String category);
    List<Preference> listByScope(String scope);
    List<Preference> listAll();
    String resolveValue(String prefKey, Long contextId, Long userId);
    Preference createOrUpdate(Preference preference);
    void deletePreference(Long id);
    Map<String, String> getAllResolved(Long contextId, Long userId);
}
