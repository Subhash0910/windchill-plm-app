package com.windchill.service.plm;

import com.windchill.common.dto.ContextMemberView;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.common.enums.RoleEnum;
import com.windchill.common.security.CurrentUserProvider;
import com.windchill.domain.entity.PlmContext;
import com.windchill.domain.entity.PlmContextMember;
import com.windchill.domain.entity.User;
import com.windchill.repository.PlmContextMemberRepository;
import com.windchill.repository.PlmContextRepository;
import com.windchill.repository.UserRepository;
import com.windchill.service.plm.security.PlmAclService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlmContextServiceImpl implements IPlmContextService {

    private final PlmContextRepository contextRepository;
    private final PlmContextMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUser;
    private final PlmAclService acl;
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

    @Override
    @Transactional(readOnly = true)
    public List<ContextMemberView> listMembers(Long contextId) {
        requireContextExists(contextId);
        acl.requireContextMember(contextId);

        return memberRepository.findByContextIdAndIsDeletedFalse(contextId)
                .stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    @Override
    public ContextMemberView addMember(Long contextId, String usernameOrEmail, RoleEnum role) {
        requireContextExists(contextId);
        acl.requireContextRole(contextId, RoleEnum.ADMIN, RoleEnum.MANAGER);

        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new BusinessException("user is required");
        }
        if (role == null) {
            throw new BusinessException("role is required");
        }

        User user = findUser(usernameOrEmail.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username/email", usernameOrEmail));

        PlmContextMember m = memberRepository.findByContextIdAndUserId(contextId, user.getId())
                .orElseGet(() -> {
                    PlmContextMember x = new PlmContextMember();
                    x.setContextId(contextId);
                    x.setUserId(user.getId());
                    return x;
                });

        m.setIsDeleted(false);
        m.setRole(role);
        PlmContextMember saved = memberRepository.save(m);

        auditService.log(PlmEntityTypeEnum.CONTEXT, contextId, "ADD_MEMBER",
                "Added/updated member userId=" + user.getId() + " role=" + role);

        return toView(saved);
    }

    @Override
    public ContextMemberView updateMemberRole(Long contextId, Long userId, RoleEnum role) {
        requireContextExists(contextId);
        acl.requireContextRole(contextId, RoleEnum.ADMIN, RoleEnum.MANAGER);

        if (userId == null) {
            throw new BusinessException("userId is required");
        }
        if (role == null) {
            throw new BusinessException("role is required");
        }

        PlmContextMember m = memberRepository.findByContextIdAndUserIdAndIsDeletedFalse(contextId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("PlmContextMember", "userId", userId));

        // Prevent lockout: don't allow downgrading the last ADMIN/MANAGER
        if (isAdminOrManager(m.getRole()) && !isAdminOrManager(role)) {
            long admins = countAdminsAndManagers(contextId);
            if (admins <= 1) {
                throw new BusinessException("Cannot downgrade the last context admin/manager");
            }
        }

        m.setRole(role);
        PlmContextMember saved = memberRepository.save(m);

        auditService.log(PlmEntityTypeEnum.CONTEXT, contextId, "UPDATE_MEMBER_ROLE",
                "Updated member userId=" + userId + " role=" + role);

        return toView(saved);
    }

    @Override
    public void removeMember(Long contextId, Long userId) {
        requireContextExists(contextId);
        acl.requireContextRole(contextId, RoleEnum.ADMIN, RoleEnum.MANAGER);

        if (userId == null) {
            throw new BusinessException("userId is required");
        }

        PlmContextMember m = memberRepository.findByContextIdAndUserIdAndIsDeletedFalse(contextId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("PlmContextMember", "userId", userId));

        // Prevent lockout: don't allow removing the last ADMIN/MANAGER
        if (isAdminOrManager(m.getRole())) {
            long admins = countAdminsAndManagers(contextId);
            if (admins <= 1) {
                throw new BusinessException("Cannot remove the last context admin/manager");
            }
        }

        m.setIsDeleted(true);
        memberRepository.save(m);

        auditService.log(PlmEntityTypeEnum.CONTEXT, contextId, "REMOVE_MEMBER",
                "Removed member userId=" + userId);
    }

    private void requireContextExists(Long contextId) {
        if (contextId == null || !contextRepository.existsById(contextId)) {
            throw new ResourceNotFoundException("PlmContext", "id", contextId);
        }
    }

    private Optional<User> findUser(String usernameOrEmail) {
        if (usernameOrEmail.contains("@")) {
            return userRepository.findByEmail(usernameOrEmail);
        }
        return userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail));
    }

    private ContextMemberView toView(PlmContextMember m) {
        User u = userRepository.findById(m.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", m.getUserId()));
        return ContextMemberView.builder()
                .userId(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(m.getRole())
                .build();
    }

    private boolean isAdminOrManager(RoleEnum role) {
        return role == RoleEnum.ADMIN || role == RoleEnum.MANAGER;
    }

    private long countAdminsAndManagers(Long contextId) {
        return memberRepository.findByContextIdAndIsDeletedFalse(contextId)
                .stream()
                .filter(x -> isAdminOrManager(x.getRole()))
                .count();
    }
}
