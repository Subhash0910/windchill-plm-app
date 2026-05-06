package com.windchill.service.security;

import com.windchill.common.exception.AccessDeniedException;
import com.windchill.domain.entity.AccessControlRule;
import com.windchill.repository.AccessControlRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Windchill-style data-driven ACL policy enforcement engine.
 *
 * <p>Evaluation follows Windchill semantics:</p>
 * <ol>
 *   <li>Collect ALL rules matching (targetType, targetId) AND (targetType, null=global).</li>
 *   <li>Filter rules whose principal matches the user's ID, any of their roles, or "ALL".</li>
 *   <li>Sort by priority DESC (deny rules should carry higher priority).</li>
 *   <li>First matching rule wins.</li>
 *   <li>No match = default DENY.</li>
 * </ol>
 *
 * <p>This is NOT the same as Spring Security {@code @PreAuthorize} annotations —
 * ACL rules are data rows that can be created, queried, and deleted at runtime,
 * just like in real Windchill.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyEnforcementService {

    private final AccessControlRuleRepository aclRepo;

    // ── Core evaluation ─────────────────────────────────────────────────────────

    /**
     * Check whether a principal (user + roles) has a given permission on a target.
     *
     * @param userId      the authenticated user's database ID (may be null for anonymous)
     * @param roles       the user's role names (e.g. ["ENGINEER", "APPROVER"])
     * @param permission  e.g. "READ", "MODIFY", "DELETE"
     * @param targetType  e.g. "PART", "DOCUMENT", "ECR"
     * @param targetId    specific object ID, or null for type-level checks
     * @return true if allowed, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean checkPermission(Long userId, List<String> roles,
                                   String permission,
                                   String targetType, Long targetId) {
        List<AccessControlRule> rules = gatherEffectiveRules(targetType, targetId);
        Set<String> principalKeys = buildPrincipalKeys(userId, roles);

        AccessControlRule verdict = findFirstMatch(rules, principalKeys, permission);
        if (verdict != null) {
            boolean allowed = Boolean.TRUE.equals(verdict.getIsAllowed());
            log.debug("ACL verdict {} for user={} roles={} perm={} target={}/{} (rule id={})",
                allowed ? "ALLOW" : "DENY", userId, roles, permission, targetType, targetId,
                verdict.getId());
            return allowed;
        }

        // Fall through to default handling
        log.debug("ACL default DENY for user={} roles={} perm={} target={}/{}: no matching rule",
            userId, roles, permission, targetType, targetId);
        return false;
    }

    /**
     * Return every permission the principal holds on a target (allow rules only).
     */
    @Transactional(readOnly = true)
    public Set<String> getPermissions(Long userId, List<String> roles,
                                      String targetType, Long targetId) {
        List<AccessControlRule> rules = gatherEffectiveRules(targetType, targetId);
        Set<String> principalKeys = buildPrincipalKeys(userId, roles);

        Set<String> permissions = new LinkedHashSet<>();
        for (AccessControlRule rule : rules) {
            if (matchesPrincipal(rule, principalKeys) && Boolean.TRUE.equals(rule.getIsAllowed())) {
                permissions.add(rule.getPermission());
            }
        }
        return permissions;
    }

    /**
     * Enforce a permission — throws AccessDeniedException if not allowed.
     */
    public void enforce(Long userId, List<String> roles,
                        String permission,
                        String targetType, Long targetId) {
        if (!checkPermission(userId, roles, permission, targetType, targetId)) {
            String principalName = (roles != null && !roles.isEmpty())
                ? "roles=" + String.join(",", roles)
                : "user=" + userId;
            throw AccessDeniedException.forPermission(principalName, permission, targetType, targetId);
        }
    }

    // ── Grant / Revoke ─────────────────────────────────────────────────────────

    /**
     * Grant (create) an allow or deny rule.
     */
    @Transactional
    public AccessControlRule grant(String principalType, Long principalId,
                                   String principalName,
                                   String permission,
                                   String targetType, Long targetId,
                                   boolean isAllowed, int priority, String scope) {
        AccessControlRule rule = new AccessControlRule();
        rule.setPrincipalType(principalType);
        rule.setPrincipalId(principalId);
        rule.setPrincipalName(principalName);
        rule.setPermission(permission);
        rule.setTargetType(targetType);
        rule.setTargetId(targetId);
        rule.setIsAllowed(isAllowed);
        rule.setPriority(priority);
        rule.setScope(scope != null ? scope : "OBJECT");
        return aclRepo.save(rule);
    }

    /**
     * Convenience: grant an allow rule with default priority 0 and scope OBJECT.
     */
    @Transactional
    public AccessControlRule grant(String principalType, Long principalId,
                                   String permission,
                                   String targetType, Long targetId) {
        return grant(principalType, principalId, null, permission, targetType, targetId,
            true, 0, "OBJECT");
    }

    /**
     * Revoke (delete) a rule by its primary key.
     */
    @Transactional
    public void revoke(Long ruleId) {
        if (!aclRepo.existsById(ruleId)) {
            log.warn("ACL rule {} not found for revocation", ruleId);
            return;
        }
        aclRepo.deleteById(ruleId);
        log.info("ACL rule {} revoked", ruleId);
    }

    /**
     * List all rules for a target type, optionally scoped to a specific object.
     */
    @Transactional(readOnly = true)
    public List<AccessControlRule> listRules(String targetType, Long targetId) {
        if (targetId != null) {
            return aclRepo.findByTargetTypeAndTargetIdOrderByPriorityDesc(targetType, targetId);
        }
        return aclRepo.findByTargetTypeOrderByPriorityDesc(targetType);
    }

    // ── Internal helpers ────────────────────────────────────────────────────────

    /**
     * Gather all rules that could apply to (targetType, targetId).
     * Includes object-specific rules AND global rules (targetId=null).
     */
    private List<AccessControlRule> gatherEffectiveRules(String targetType, Long targetId) {
        List<AccessControlRule> rules = new java.util.ArrayList<>(
            aclRepo.findByTargetTypeAndTargetIdOrderByPriorityDesc(targetType, targetId));
        rules.addAll(aclRepo.findByTargetTypeAndTargetIdIsNullOrderByPriorityDesc(targetType));
        rules.sort((a, b) -> Integer.compare(b.getPriority(), a.getPriority()));
        return rules;
    }

    /**
     * Build a set of principal keys the engine will match against rules.
     * Includes: "USER:<id>", "ROLE:<role>" for each role, and "ALL".
     */
    private Set<String> buildPrincipalKeys(Long userId, List<String> roles) {
        Set<String> keys = new HashSet<>();
        if (userId != null) {
            keys.add("USER:" + userId);
        }
        if (roles != null) {
            for (String role : roles) {
                keys.add("ROLE:" + role.toUpperCase());
            }
        }
        keys.add("ALL");
        return keys;
    }

    /**
     * Check whether a single rule's principal matches the provided principal keys.
     */
    private boolean matchesPrincipal(AccessControlRule rule, Set<String> principalKeys) {
        String pt = rule.getPrincipalType();
        if ("ALL".equalsIgnoreCase(pt)) {
            return true;
        }
        if ("USER".equalsIgnoreCase(pt)) {
            return rule.getPrincipalId() != null
                && principalKeys.contains("USER:" + rule.getPrincipalId());
        }
        if ("ROLE".equalsIgnoreCase(pt)) {
            String roleName = rule.getPrincipalName() != null
                ? rule.getPrincipalName().toUpperCase()
                : null;
            return roleName != null && principalKeys.contains("ROLE:" + roleName);
        }
        if ("GROUP".equalsIgnoreCase(pt)) {
            String groupName = rule.getPrincipalName() != null
                ? rule.getPrincipalName().toUpperCase()
                : null;
            return groupName != null && principalKeys.contains("GROUP:" + groupName);
        }
        return false;
    }

    /**
     * Return the first (highest-priority) rule that matches the principal AND
     * the requested permission. The rules list is assumed pre-sorted by priority DESC.
     */
    private AccessControlRule findFirstMatch(List<AccessControlRule> rules,
                                              Set<String> principalKeys,
                                              String permission) {
        for (AccessControlRule rule : rules) {
            if (rule.getPermission().equalsIgnoreCase(permission)
                && matchesPrincipal(rule, principalKeys)) {
                return rule;
            }
        }
        return null;
    }
}
