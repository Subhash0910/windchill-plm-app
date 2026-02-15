package com.windchill.service.plm;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.PlmContext;
import com.windchill.repository.PlmContextRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlmContextServiceImpl implements IPlmContextService {

    private final PlmContextRepository contextRepository;
    private final IAuditService auditService;

    @Override
    public PlmContext createContext(PlmContext context) {
        if (context.getCode() == null || context.getCode().isBlank()) {
            throw new BusinessException("Context code is required");
        }
        if (contextRepository.existsByCode(context.getCode())) {
            throw new BusinessException("Context code already exists: " + context.getCode());
        }
        if (context.getName() == null || context.getName().isBlank()) {
            throw new BusinessException("Context name is required");
        }
        if (context.getContextType() == null) {
            throw new BusinessException("Context type is required");
        }

        PlmContext saved = contextRepository.save(context);
        auditService.log(PlmEntityTypeEnum.CONTEXT, saved.getId(), "CREATE", "Context created");
        log.info("PLM context created: {} ({})", saved.getName(), saved.getCode());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public PlmContext getContext(Long id) {
        return contextRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PlmContext", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlmContext> listContexts() {
        return contextRepository.findAll();
    }
}
