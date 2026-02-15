package com.windchill.service.plm;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.common.enums.RoleEnum;
import com.windchill.common.security.CurrentUserProvider;
import com.windchill.domain.entity.PlmContext;
import com.windchill.domain.entity.PlmContextMember;
import com.windchill.repository.PlmContextMemberRepository;
import com.windchill.repository.PlmContextRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlmContextServiceImpl implements IPlmContextService {

    private final PlmContextRepository contextRepository;
    private final PlmContextMemberRepository memberRepository;
    private final CurrentUserProvider currentUser;
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

        Long userId = currentUser.getUserId();
        if (userId == null) {
            throw new BusinessException("Unauthenticated");
        }

        PlmContext saved = contextRepository.save(context);

        // Auto-add creator as a member (private contexts by default)
        if (!memberRepository.existsByContextIdAndUserIdAndIsDeletedFalse(saved.getId(), userId)) {
            PlmContextMember m = new PlmContextMember();
            m.setContextId(saved.getId());
            m.setUserId(userId);
            // Creator gets full container control; global ADMIN remains a global bypass.
            m.setRole(currentUser.getRole() == RoleEnum.ADMIN ? RoleEnum.ADMIN : RoleEnum.MANAGER);
            memberRepository.save(m);
        }

        auditService.log(PlmEntityTypeEnum.CONTEXT, saved.getId(), "CREATE", "Context created");
        log.info("PLM context created: {} ({})", saved.getName(), saved.getCode());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public PlmContext getContext(Long id) {
        if (currentUser.getRole() != RoleEnum.ADMIN) {
            Long userId = currentUser.getUserId();
            if (userId == null || !memberRepository.existsByContextIdAndUserIdAndIsDeletedFalse(id, userId)) {
                throw new BusinessException("Access denied: not a member of this context");
            }
        }

        return contextRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PlmContext", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlmContext> listContexts() {
        if (currentUser.getRole() == RoleEnum.ADMIN) {
            return contextRepository.findAll();
        }
        Long userId = currentUser.getUserId();
        if (userId == null) {
            throw new BusinessException("Unauthenticated");
        }
        List<Long> ids = memberRepository.findByUserIdAndIsDeletedFalse(userId)
                .stream()
                .map(PlmContextMember::getContextId)
                .distinct()
                .collect(Collectors.toList());

        if (ids.isEmpty()) return List.of();
        return contextRepository.findAllById(ids);
    }
}
