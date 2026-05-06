package com.windchill.service.plm;

import com.windchill.domain.entity.NumberingScheme;

import java.util.List;

public interface INumberingSchemeService {
    List<NumberingScheme> listByTargetType(String targetType);
    List<NumberingScheme> listAll();
    NumberingScheme create(NumberingScheme scheme);
    NumberingScheme update(Long id, NumberingScheme details);
    NumberingScheme resetSequence(Long id);
    String generateNumber(String targetType);
    NumberingScheme getScheme(Long id);
}
