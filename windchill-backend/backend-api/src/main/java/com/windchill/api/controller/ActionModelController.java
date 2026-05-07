package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.ActionModel;
import com.windchill.repository.ActionModelRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ActionModelController {

    private final ActionModelRepository actionModelRepository;

    /* ── List all (for registry admin page) ── */
    @GetMapping("/api/v1/plm/actions")
    public ResponseEntity<ApiResponse<?>> listAll(
            @RequestParam(required = false) String objectType) {
        List<ActionModel> models = objectType != null
                ? actionModelRepository.findByObjectTypeAndIsEnabledTrueAndIsDeletedFalseOrderBySortOrderAscIdAsc(objectType)
                : actionModelRepository.findByIsDeletedFalseOrderByObjectTypeAscSortOrderAscIdAsc();
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(models).build());
    }

    /* ── Create / register new action ── */
    @PostMapping("/api/v1/plm/actions")
    public ResponseEntity<ApiResponse<?>> create(@RequestBody ActionRequest req) {
        validate(req);
        if (actionModelRepository.existsByObjectTypeAndActionNameAndIsDeletedFalse(
                req.getObjectType(), req.getActionName())) {
            throw new BusinessException("Action '" + req.getActionName()
                    + "' already registered for object type " + req.getObjectType());
        }
        ActionModel m = fromRequest(new ActionModel(), req);
        ActionModel saved = actionModelRepository.save(m);
        log.info("Action model registered: {}:{}", saved.getObjectType(), saved.getActionName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(saved).build());
    }

    /* ── Update ── */
    @PutMapping("/api/v1/plm/actions/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable Long id, @RequestBody ActionRequest req) {
        ActionModel m = actionModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ActionModel", "id", id));
        fromRequest(m, req);
        ActionModel saved = actionModelRepository.save(m);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(saved).build());
    }

    /* ── Toggle enabled/disabled ── */
    @PatchMapping("/api/v1/plm/actions/{id}/toggle")
    public ResponseEntity<ApiResponse<?>> toggle(@PathVariable Long id) {
        ActionModel m = actionModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ActionModel", "id", id));
        m.setIsEnabled(!Boolean.TRUE.equals(m.getIsEnabled()));
        actionModelRepository.save(m);
        return ResponseEntity.ok(ApiResponse.builder().success(true)
                .message(m.getIsEnabled() ? "Action enabled" : "Action disabled").data(m).build());
    }

    /* ── Delete ── */
    @DeleteMapping("/api/v1/plm/actions/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        ActionModel m = actionModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ActionModel", "id", id));
        m.setIsDeleted(true);
        actionModelRepository.save(m);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.DELETED).data(null).build());
    }

    /* ── Generate Windchill-style XML for an action ── */
    @GetMapping("/api/v1/plm/actions/{id}/xml")
    public ResponseEntity<ApiResponse<?>> generateXml(@PathVariable Long id) {
        ActionModel m = actionModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ActionModel", "id", id));
        String xml = buildXml(m);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(xml).build());
    }

    /* ── Helpers ── */
    private void validate(ActionRequest req) {
        if (req.getObjectType() == null || req.getObjectType().isBlank())
            throw new BusinessException("objectType is required");
        if (req.getActionName() == null || req.getActionName().isBlank())
            throw new BusinessException("actionName is required");
        if (req.getLabel() == null || req.getLabel().isBlank())
            throw new BusinessException("label is required");
    }

    private ActionModel fromRequest(ActionModel m, ActionRequest req) {
        if (req.getObjectType()     != null) m.setObjectType(req.getObjectType().toUpperCase().trim());
        if (req.getActionName()     != null) m.setActionName(req.getActionName().trim());
        if (req.getLabel()          != null) m.setLabel(req.getLabel().trim());
        if (req.getIcon()           != null) m.setIcon(req.getIcon());
        if (req.getDescription()    != null) m.setDescription(req.getDescription());
        if (req.getActionGroup()    != null) m.setActionGroup(req.getActionGroup());
        if (req.getProcessorClass() != null) m.setProcessorClass(req.getProcessorClass().trim());
        if (req.getProcessorMethod()!= null) m.setProcessorMethod(req.getProcessorMethod().trim());
        if (req.getEndpoint()       != null) m.setEndpoint(req.getEndpoint().trim());
        if (req.getHttpMethod()     != null) m.setHttpMethod(req.getHttpMethod().toUpperCase().trim());
        if (req.getMinRole()        != null) m.setMinRole(req.getMinRole().toUpperCase().trim());
        if (req.getToolbarSection() != null) m.setToolbarSection(req.getToolbarSection().toUpperCase().trim());
        if (req.getSortOrder()      != null) m.setSortOrder(req.getSortOrder());
        if (req.getEnabledStates()  != null) m.setEnabledStates(req.getEnabledStates());
        if (req.getIsEnabled()      != null) m.setIsEnabled(req.getIsEnabled());
        if (req.getCustomXml()      != null) m.setCustomXml(req.getCustomXml());
        return m;
    }

    static String buildXml(ActionModel m) {
        String states = m.getEnabledStates() != null ? m.getEnabledStates() : "ALL";
        String cls    = m.getProcessorClass() != null ? m.getProcessorClass() : "com.windchill.api.controller." + m.getObjectType() + "Controller";
        String method = m.getProcessorMethod() != null ? m.getProcessorMethod() : m.getActionName();
        String ep     = m.getEndpoint() != null ? m.getEndpoint() : "/api/v1/plm/" + m.getObjectType().toLowerCase() + "s/{id}/" + m.getActionName();
        String rb     = "com.windchill.plm.msgs." + m.getObjectType().substring(0,1).toUpperCase()
                      + m.getObjectType().substring(1).toLowerCase() + "Actions";
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
             + "<!--\n"
             + "  Windchill Action Model Registration\n"
             + "  Equivalent to: codebase/config/actions/site_actionmodels.xml\n"
             + "  Object Type : " + m.getObjectType() + "\n"
             + "  Action Name : " + m.getActionName() + "\n"
             + "  Generated   : " + java.time.LocalDate.now() + "\n"
             + "-->\n"
             + "<actionModels xmlns=\"http://www.ptc.com/windchill/actionModel\"\n"
             + "              version=\"11.0\">\n\n"
             + "  <action name=\"" + m.getActionName() + "\"\n"
             + "          resourceBundle=\"" + rb + "\"\n"
             + "          objectType=\"wt." + m.getObjectType().toLowerCase() + ".WTPart\"\n"
             + "          toolbarSection=\"" + m.getToolbarSection() + "\"\n"
             + "          sortOrder=\"" + m.getSortOrder() + "\">\n\n"
             + "    <!-- Form Processor: handles the action when user clicks the button -->\n"
             + "    <command\n"
             + "        method=\"" + method + "\"\n"
             + "        class=\"" + cls + "\"\n"
             + "        windowType=\"hidden\"\n"
             + "        minRole=\"ROLE_" + m.getMinRole() + "\">\n"
             + "      <inputparams>\n"
             + "        <param name=\"oid\"  data=\"oid\"/>\n"
             + "        <param name=\"type\" data=\"type\" value=\"" + m.getObjectType() + "\"/>\n"
             + "      </inputparams>\n"
             + "    </command>\n\n"
             + "    <!-- REST endpoint equivalent -->\n"
             + "    <restMapping method=\"" + m.getHttpMethod() + "\" path=\"" + ep + "\"/>\n\n"
             + "    <label>" + m.getLabel() + "</label>\n"
             + "    <icon>" + (m.getIcon() != null ? m.getIcon() : "") + "</icon>\n\n"
             + "    <!-- Visibility condition: which lifecycle states enable this action -->\n"
             + "    <enabledWhen state=\"" + states + "\"/>\n\n"
             + "    <description>" + (m.getDescription() != null ? m.getDescription() : "") + "</description>\n"
             + "  </action>\n\n"
             + "</actionModels>\n";
    }

    /* ── Request DTO ── */
    @Data
    public static class ActionRequest {
        private String objectType;
        private String actionName;
        private String label;
        private String icon;
        private String description;
        private String actionGroup;
        private String processorClass;
        private String processorMethod;
        private String endpoint;
        private String httpMethod;
        private String minRole;
        private String toolbarSection;
        private Integer sortOrder;
        private String enabledStates;
        private Boolean isEnabled;
        private String customXml;
    }

    /* ── Default action seed (runs at startup in demo/dev/docker profile) ── */
    @Bean
    @Order(10)
    public ApplicationRunner seedDefaultActions() {
        return args -> {
            if (actionModelRepository.count() > 0) return;
            log.info("Seeding default Windchill action model registry...");

            seed("PART", "checkout",     "Check Out",        "🔒", "Reserves this part version for editing",
                 "com.windchill.service.plm.PartServiceImpl", "checkOut",
                 "/api/v1/plm/parts/{id}/checkout", "POST", "ENGINEER",
                 "PRIMARY", "INWORK,UNDERREVIEW", 10, "checkout-group");

            seed("PART", "checkin",      "Check In",         "✅", "Commits changes and releases the checkout lock",
                 "com.windchill.service.plm.PartServiceImpl", "checkIn",
                 "/api/v1/plm/parts/{id}/checkin", "POST", "ENGINEER",
                 "PRIMARY", "INWORK", 20, "checkout-group");

            seed("PART", "undoCheckout", "Undo Checkout",    "↩", "Discards working copy and releases lock",
                 "com.windchill.service.plm.PartServiceImpl", "undoCheckOut",
                 "/api/v1/plm/parts/{id}/undo-checkout", "POST", "ENGINEER",
                 "SECONDARY", "INWORK", 25, "checkout-group");

            seed("PART", "submitReview", "Submit for Review","📤", "Moves the part to UNDER REVIEW lifecycle state",
                 "com.windchill.service.plm.PartServiceImpl", "promote",
                 "/api/v1/plm/parts/{id}/promote?target=UNDERREVIEW", "POST", "ENGINEER",
                 "PRIMARY", "INWORK", 30, "lifecycle-group");

            seed("PART", "release",      "Release",          "🚀", "Moves part to RELEASED state — no further edits without revision",
                 "com.windchill.service.plm.PartServiceImpl", "promote",
                 "/api/v1/plm/parts/{id}/promote?target=RELEASED", "POST", "MANAGER",
                 "PRIMARY", "UNDERREVIEW", 40, "lifecycle-group");

            seed("PART", "obsolete",     "Obsolete",         "🗑", "Marks part as obsolete — permanently unavailable for new designs",
                 "com.windchill.service.plm.PartServiceImpl", "promote",
                 "/api/v1/plm/parts/{id}/promote?target=OBSOLETE", "POST", "MANAGER",
                 "SECONDARY", "RELEASED", 50, "lifecycle-group");

            seed("PART", "revise",       "New Revision",     "📋", "Creates a new revision series (A→B) for major changes",
                 "com.windchill.service.plm.PartServiceImpl", "revisePart",
                 "/api/v1/plm/parts/{id}/revise", "POST", "ENGINEER",
                 "PRIMARY", "RELEASED", 60, "revision-group");

            seed("PART", "analyzeImpact","Analyze Impact",   "⚡", "Run AI-powered change impact analysis on this part",
                 "com.windchill.service.AIImpactServiceImpl", "analyzeImpact",
                 "/api/v1/ai/impact/part/{id}", "POST", "ENGINEER",
                 "OVERFLOW", null, 70, "ai-group");

            seed("PART", "newEcr",       "New Change Request","📋", "Open an Engineering Change Request referencing this part",
                 "com.windchill.api.controller.ChangeRequestController", "create",
                 "/api/v1/plm/changes", "POST", "ENGINEER",
                 "OVERFLOW", null, 80, "change-group");

            // ECR actions
            seed("ECR", "submit",       "Submit",           "📤", "Submit ECR for engineering review",
                 "com.windchill.api.controller.ChangeRequestController", "submit",
                 "/api/v1/plm/changes/{id}/submit", "POST", "ENGINEER",
                 "PRIMARY", "DRAFT", 10, "lifecycle-group");

            seed("ECR", "startReview",  "Start Review",     "🔍", "Move ECR into active review phase",
                 "com.windchill.api.controller.ChangeRequestController", "startReview",
                 "/api/v1/plm/changes/{id}/start-review", "POST", "MANAGER",
                 "PRIMARY", "SUBMITTED", 20, "lifecycle-group");

            seed("ECR", "approve",      "Approve",          "✅", "Approve the engineering change request",
                 "com.windchill.api.controller.ChangeRequestController", "approve",
                 "/api/v1/plm/changes/{id}/approve", "POST", "MANAGER",
                 "PRIMARY", "IN_REVIEW", 30, "lifecycle-group");

            seed("ECR", "reject",       "Reject",           "❌", "Reject and return ECR to submitter",
                 "com.windchill.api.controller.ChangeRequestController", "reject",
                 "/api/v1/plm/changes/{id}/reject", "POST", "MANAGER",
                 "SECONDARY", "IN_REVIEW", 40, "lifecycle-group");

            seed("ECR", "close",        "Close",            "🔒", "Close ECR — no further modifications",
                 "com.windchill.api.controller.ChangeRequestController", "close",
                 "/api/v1/plm/changes/{id}/close", "POST", "MANAGER",
                 "SECONDARY", "APPROVED", 50, "lifecycle-group");

            // Document actions
            seed("DOCUMENT", "checkout",    "Check Out",     "🔒", "Lock document version for editing",
                 "com.windchill.service.document.DocumentServiceImpl", "checkOut",
                 "/api/v1/documents/{id}/checkout", "POST", "ENGINEER",
                 "PRIMARY", "INWORK,UNDERREVIEW", 10, "checkout-group");

            seed("DOCUMENT", "promote",     "Promote",       "▶", "Advance document lifecycle state",
                 "com.windchill.service.document.DocumentServiceImpl", "promote",
                 "/api/v1/documents/{id}/promote", "POST", "ENGINEER",
                 "PRIMARY", "INWORK", 20, "lifecycle-group");

            log.info("Default action model registry seeded ({} actions)", actionModelRepository.count());
        };
    }

    private void seed(String objectType, String actionName, String label, String icon, String description,
                      String processorClass, String processorMethod, String endpoint, String httpMethod,
                      String minRole, String toolbarSection, String enabledStates, int sortOrder, String actionGroup) {
        if (actionModelRepository.existsByObjectTypeAndActionNameAndIsDeletedFalse(objectType, actionName)) return;
        ActionModel m = new ActionModel();
        m.setObjectType(objectType);
        m.setActionName(actionName);
        m.setLabel(label);
        m.setIcon(icon);
        m.setDescription(description);
        m.setProcessorClass(processorClass);
        m.setProcessorMethod(processorMethod);
        m.setEndpoint(endpoint);
        m.setHttpMethod(httpMethod);
        m.setMinRole(minRole);
        m.setToolbarSection(toolbarSection);
        m.setEnabledStates(enabledStates);
        m.setSortOrder(sortOrder);
        m.setActionGroup(actionGroup);
        m.setIsEnabled(true);
        actionModelRepository.save(m);
    }
}
