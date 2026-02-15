package com.windchill.service.plm.security;

import com.windchill.common.enums.RoleEnum;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.security.CurrentUserProvider;
import com.windchill.domain.entity.PlmContextMember;
import com.windchill.repository.PlmContextMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlmAclService {

    private final CurrentUserProvider currentUser;
    private final PlmContextMemberRepository memberRepository;

    public Long requireUserId() {
        Long id = currentUser.getUserId();
        if (id == null) {
            throw new BusinessException("Unauthenticated");
        }
        return id;
    }

    public boolean isGlobalAdmin() {
        return currentUser.getRole() == RoleEnum.ADMIN;
    }

    public void requireContextMember(Long contextId) {
        if (isGlobalAdmin()) return;
        Long userId = requireUserId();
        if (!memberRepository.existsByContextIdAndUserIdAndIsDeletedFalse(contextId, userId)) {
            throw new BusinessException("Access denied: not a member of this context");
        }
    }

    public PlmContextMember requireMembership(Long contextId) {
        if (isGlobalAdmin()) return null;
        Long userId = requireUserId();
        return memberRepository.findByContextIdAndUserIdAndIsDeletedFalse(contextId, userId)
                .orElseThrow(() -> new BusinessException("Access denied: not a member of this context"));
    }

    public void requireContextRole(Long contextId, RoleEnum... allowed) {
        if (isGlobalAdmin()) return;
        PlmContextMember m = requireMembership(contextId);
        RoleEnum role = m.getRole();
        if (allowed != null) {
            for (RoleEnum a : allowed) {
                if (a == role) return;
            }
        }
        throw new BusinessException("Access denied: insufficient role for this action");
    }
}
