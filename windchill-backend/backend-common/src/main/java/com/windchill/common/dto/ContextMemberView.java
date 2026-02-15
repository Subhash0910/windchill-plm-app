package com.windchill.common.dto;

import com.windchill.common.enums.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContextMemberView {
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private RoleEnum role;
}
