package com.windchill.service.plm;

import com.windchill.common.dto.ContextMemberView;
import com.windchill.common.enums.RoleEnum;
import com.windchill.domain.entity.PlmContext;

import java.util.List;

public interface IPlmContextService {
    PlmContext createContext(PlmContext context);
    PlmContext getContext(Long id);
    List<PlmContext> listContexts();

    // Team / membership (Windchill-like container team)
    List<ContextMemberView> listMembers(Long contextId);
    ContextMemberView addMember(Long contextId, String usernameOrEmail, RoleEnum role);
    ContextMemberView updateMemberRole(Long contextId, Long userId, RoleEnum role);
    void removeMember(Long contextId, Long userId);
}
