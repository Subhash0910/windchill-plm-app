package com.windchill.service.plm;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.NumberingScheme;
import com.windchill.repository.NumberingSchemeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NumberingSchemeServiceImpl implements INumberingSchemeService {

    private final NumberingSchemeRepository numberingSchemeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NumberingScheme> listByTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return numberingSchemeRepository.findAllByIsDeletedFalse();
        }
        return numberingSchemeRepository.findByTargetTypeAndIsDeletedFalse(targetType);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NumberingScheme> listAll() {
        return numberingSchemeRepository.findAllByIsDeletedFalse();
    }

    @Override
    public NumberingScheme create(NumberingScheme scheme) {
        if (scheme.getSchemeName() == null || scheme.getSchemeName().isBlank()) {
            throw new BusinessException("schemeName is required");
        }
        if (scheme.getTargetType() == null || scheme.getTargetType().isBlank()) {
            throw new BusinessException("targetType is required");
        }
        scheme.setSequenceCurrent(scheme.getSequenceStart() != null ? scheme.getSequenceStart() : 1);
        NumberingScheme saved = numberingSchemeRepository.save(scheme);
        log.info("Created numbering scheme: {} for {}", saved.getSchemeName(), saved.getTargetType());
        return saved;
    }

    @Override
    public NumberingScheme update(Long id, NumberingScheme details) {
        NumberingScheme scheme = numberingSchemeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NumberingScheme", "id", id));

        if (details.getSchemeName() != null) scheme.setSchemeName(details.getSchemeName());
        if (details.getPrefix() != null) scheme.setPrefix(details.getPrefix());
        if (details.getSuffix() != null) scheme.setSuffix(details.getSuffix());
        if (details.getIncludeYear() != null) scheme.setIncludeYear(details.getIncludeYear());
        if (details.getIncludeContext() != null) scheme.setIncludeContext(details.getIncludeContext());
        if (details.getSequenceStart() != null) scheme.setSequenceStart(details.getSequenceStart());
        if (details.getSequenceIncrement() != null) scheme.setSequenceIncrement(details.getSequenceIncrement());
        if (details.getMinDigits() != null) scheme.setMinDigits(details.getMinDigits());
        if (details.getIsActive() != null) scheme.setIsActive(details.getIsActive());
        if (details.getIsDefault() != null) scheme.setIsDefault(details.getIsDefault());

        return numberingSchemeRepository.save(scheme);
    }

    @Override
    public NumberingScheme resetSequence(Long id) {
        NumberingScheme scheme = numberingSchemeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NumberingScheme", "id", id));
        scheme.setSequenceCurrent(scheme.getSequenceStart());
        log.info("Reset sequence for scheme: {} to {}", scheme.getSchemeName(), scheme.getSequenceStart());
        return numberingSchemeRepository.save(scheme);
    }

    @Override
    public String generateNumber(String targetType) {
        NumberingScheme scheme = numberingSchemeRepository
                .findByTargetTypeAndIsDefaultTrueAndIsActiveTrue(targetType)
                .orElseThrow(() -> new BusinessException(
                        "No active default numbering scheme found for targetType: " + targetType));

        StringBuilder sb = new StringBuilder();
        if (scheme.getPrefix() != null) sb.append(scheme.getPrefix());
        if (scheme.getIncludeYear()) sb.append(Year.now().getValue()).append("-");
        // includeContext would use a context code, but for now we append a placeholder pattern
        // Context codes would be resolved from PlmContext in a full implementation
        String seqStr = String.format("%0" + scheme.getMinDigits() + "d", scheme.getSequenceCurrent());
        sb.append(seqStr);
        if (scheme.getSuffix() != null) sb.append(scheme.getSuffix());

        // Increment the sequence
        scheme.setSequenceCurrent(scheme.getSequenceCurrent() + scheme.getSequenceIncrement());
        numberingSchemeRepository.save(scheme);

        log.info("Generated number {} for targetType {}", sb, targetType);
        return sb.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public NumberingScheme getScheme(Long id) {
        return numberingSchemeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NumberingScheme", "id", id));
    }
}
