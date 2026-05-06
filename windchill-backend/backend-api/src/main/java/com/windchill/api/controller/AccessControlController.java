package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.AccessControlRule;
import com.windchill.service.security.PolicyEnforcementService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * REST controller for Windchill-style ACL (Access Control List) administration.
 *
 * Base path: /api/v1/admin/acl
 *
 * Endpoints:
 *   GET  /check?userId=X&permission=READ&targetType=PART&targetId=1  → { allowed: true/false }
 *   GET  /permissions?userId=X&targetType=PART&targetId=1            → [ "READ", "MODIFY" ]
 *   GET  /rules?targetType=PART[&targetId=1]                         → list of rules
 *   POST /rules                                                      → create a rule
 *   DELETE /rules/{id}                                               → revoke a rule
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/acl")
@RequiredArgsConstructor
public class AccessControlController {

    private final PolicyEnforcementService policyService;

    // ── Query endpoints ────────────────────────────────────────────────────────

    /**
     * Check a single permission for a user on a target.
     *
     * <pre>GET /api/v1/admin/acl/check?userId=1&permission=READ&targetType=PART&targetId=10</pre>
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<PermissionCheckResult>> check(
            @RequestParam Long userId,
            @RequestParam String permission,
            @RequestParam String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false, defaultValue = "") List<String> roles) {

        if (roles == null || roles.isEmpty()) {
            roles = Collections.emptyList();
        }

        boolean allowed = policyService.checkPermission(userId, roles, permission, targetType, targetId);
        PermissionCheckResult result = new PermissionCheckResult();
        result.setUserId(userId);
        result.setPermission(permission);
        result.setTargetType(targetType);
        result.setTargetId(targetId);
        result.setAllowed(allowed);
        result.setRoles(roles);

        log.info("ACL check: user={} roles={} {} on {}/{} → {}",
            userId, roles, permission, targetType, targetId, allowed ? "ALLOW" : "DENY");

        return ResponseEntity.ok(ApiResponse.success(result, "ACL check completed"));
    }

    /**
     * Get all permissions a user holds on a specific object.
     *
     * <pre>GET /api/v1/admin/acl/permissions?userId=1&targetType=PART&targetId=10</pre>
     */
    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<Set<String>>> permissions(
            @RequestParam Long userId,
            @RequestParam String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false, defaultValue = "") List<String> roles) {

        if (roles == null || roles.isEmpty()) {
            roles = Collections.emptyList();
        }

        Set<String> perms = policyService.getPermissions(userId, roles, targetType, targetId);
        return ResponseEntity.ok(ApiResponse.success(perms, "User permissions"));
    }

    // ── Rule CRUD ──────────────────────────────────────────────────────────────

    /**
     * List ACL rules, optionally filtered by targetType and/or targetId.
     *
     * <pre>GET /api/v1/admin/acl/rules?targetType=PART&targetId=10</pre>
     */
    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<List<AccessControlRule>>> listRules(
            @RequestParam String targetType,
            @RequestParam(required = false) Long targetId) {

        List<AccessControlRule> rules = policyService.listRules(targetType, targetId);
        return ResponseEntity.ok(ApiResponse.success(rules, rules.size() + " rule(s) found"));
    }

    /**
     * Create a new ACL rule.
     *
     * <pre>POST /api/v1/admin/acl/rules</pre>
     */
    @PostMapping("/rules")
    public ResponseEntity<ApiResponse<AccessControlRule>> createRule(
            @RequestBody CreateRuleRequest request) {

        AccessControlRule rule = policyService.grant(
            request.getPrincipalType(),
            request.getPrincipalId(),
            request.getPrincipalName(),
            request.getPermission(),
            request.getTargetType(),
            request.getTargetId(),
            request.getIsAllowed() != null ? request.getIsAllowed() : true,
            request.getPriority() != null ? request.getPriority() : 0,
            request.getScope() != null ? request.getScope() : "OBJECT"
        );

        log.info("ACL rule created: id={} principal={}:{} perm={} on {}/{}, allowed={}, priority={}",
            rule.getId(), rule.getPrincipalType(), rule.getPrincipalName(),
            rule.getPermission(), rule.getTargetType(), rule.getTargetId(),
            rule.getIsAllowed(), rule.getPriority());

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(rule, "ACL rule created"));
    }

    /**
     * Revoke (delete) an ACL rule by ID.
     *
     * <pre>DELETE /api/v1/admin/acl/rules/42</pre>
     */
    @DeleteMapping("/rules/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable Long id) {
        policyService.revoke(id);
        return ResponseEntity.ok(ApiResponse.success(null, "ACL rule " + id + " revoked"));
    }

    // ── Inner DTOs ─────────────────────────────────────────────────────────────

    @Data
    public static class PermissionCheckResult {
        private Long userId;
        private String permission;
        private String targetType;
        private Long targetId;
        private boolean allowed;
        private List<String> roles;
    }

    @Data
    public static class CreateRuleRequest {
        private String principalType;
        private Long principalId;
        private String principalName;
        private String permission;
        private String targetType;
        private Long targetId;
        private Boolean isAllowed;
        private Integer priority;
        private String scope;
    }
}
