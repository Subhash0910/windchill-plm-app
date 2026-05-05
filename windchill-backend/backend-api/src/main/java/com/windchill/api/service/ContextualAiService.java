package com.windchill.api.service;

import com.windchill.api.dto.ai.ContextualAiFactDto;
import com.windchill.api.dto.ai.ContextualAiResponseDto;
import com.windchill.api.document.WTDocument;
import com.windchill.api.document.WTDocumentRepository;
import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.PromotionRequestStatusEnum;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.PromotionRequest;
import com.windchill.domain.entity.WorkItem;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.PartRepository;
import com.windchill.repository.PromotionRequestRepository;
import com.windchill.repository.WorkItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContextualAiService {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm", Locale.ENGLISH);
    private static final Set<PromotionRequestStatusEnum> ACTIVE_PROMOTION_STATUSES = EnumSet.of(
            PromotionRequestStatusEnum.PENDING_APPROVAL
    );

    private final PartRepository partRepository;
    private final BomLineRepository bomLineRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final WorkItemRepository workItemRepository;
    private final PromotionRequestRepository promotionRequestRepository;
    private final WTDocumentRepository wtDocumentRepository;

    public ContextualAiResponseDto getPartGuidance(Long partId) {
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new IllegalArgumentException("Part not found: " + partId));

        List<Long> parentIds = bomLineRepository.findDistinctParentPartIdsByChildPartId(partId);
        int whereUsedCount = parentIds.size();
        int bomChildrenCount = bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(partId).size();
        List<ChangeRequest> relatedChanges = findOpenChangesForPart(partId);
        Optional<PromotionRequest> activePromotion = promotionRequestRepository
                .findFirstByPartIdAndStatusInOrderByCreatedAtDesc(partId, new ArrayList<>(ACTIVE_PROMOTION_STATUSES));

        List<ContextualAiFactDto> facts = new ArrayList<>();
        facts.add(fact("Lifecycle state", valueOf(part.getLifecycleState())));
        facts.add(fact("Version", valueOf(part.getRevision()) + "." + valueOf(part.getIteration())));
        facts.add(fact("Where used", String.valueOf(whereUsedCount)));
        facts.add(fact("BOM children", String.valueOf(bomChildrenCount)));
        facts.add(fact("Open changes", String.valueOf(relatedChanges.size())));
        if (activePromotion.isPresent()) {
            PromotionRequest pr = activePromotion.get();
            facts.add(fact("Active promotion", valueOf(pr.getStatus()) + " to " + valueOf(pr.getToState())));
        }

        List<String> warnings = new ArrayList<>();
        List<String> actions = new ArrayList<>();
        String assessment;
        int confidence = 78;

        LifecycleStateEnum state = part.getLifecycleState();
        if (state == LifecycleStateEnum.RELEASED) {
            assessment = whereUsedCount > 0
                    ? "This released part is already used in parent structures, so changes should go through formal change control."
                    : "This released part is stable, but any modification should still be handled through a controlled revise-and-review flow.";
            actions.add("Open a change request before modifying this released part.");
            actions.add("Revise the part instead of editing the released revision directly.");
            if (whereUsedCount > 0) {
                actions.add("Review where-used parents before changing form, fit, or function.");
            }
            warnings.add("Released objects should not be changed as ad-hoc working copies.");
            confidence = 89;
        } else if (state == LifecycleStateEnum.UNDERREVIEW) {
            assessment = "This part is already in review, so the safest next step is to finish or redirect the review before making more edits.";
            actions.add("Let the current review complete before creating more iteration changes.");
            actions.add("Check open work items and reviewer feedback before revising scope.");
            warnings.add("Parallel edits during review can confuse approvals and audit history.");
            confidence = 85;
        } else if (state == LifecycleStateEnum.OBSOLETE) {
            assessment = "This part is marked obsolete, so changes should focus on traceability, replacements, and downstream impact rather than routine edits.";
            actions.add("Confirm replacement parts or disposition before reactivating work.");
            actions.add("Inspect where-used relationships before removing or superseding this part.");
            warnings.add("Obsolete parts can still affect released parents and service documentation.");
            confidence = 84;
        } else {
            assessment = whereUsedCount > 0
                    ? "This in-work part is editable, but it already influences parent structures, so you should check usage before changing it."
                    : "This in-work part is in the safest state for normal editing and preparation for review.";
            actions.add("Continue editing the working data and save changes on the current iteration.");
            actions.add(whereUsedCount > 0
                    ? "Inspect where-used parents before changing the structure."
                    : "Submit for review once the part definition is stable.");
            if (bomChildrenCount > 0) {
                actions.add("Validate child relationships before sending the part to review.");
            }
            confidence = 76;
        }

        if (whereUsedCount > 0) {
            warnings.add("Used in " + whereUsedCount + " parent assembly" + (whereUsedCount == 1 ? "" : "ies") + ".");
        }
        if (!relatedChanges.isEmpty()) {
            warnings.add("Referenced by " + relatedChanges.size() + " open change request" + (relatedChanges.size() == 1 ? "" : "s") + ".");
        }
        if (bomChildrenCount >= 8) {
            warnings.add("This part has a larger-than-average BOM and should be reviewed for downstream impact.");
        }

        return ContextualAiResponseDto.builder()
                .facts(facts)
                .assessment(assessment)
                .recommendedActions(actions)
                .warnings(warnings)
                .confidence(confidence)
                .build();
    }

    public ContextualAiResponseDto getEcrReviewSummary(Long ecrId) {
        ChangeRequest ecr = changeRequestRepository.findById(ecrId)
                .orElseThrow(() -> new IllegalArgumentException("ECR not found: " + ecrId));

        List<Long> impactedPartIds = parseIds(ecr.getImpactedPartIds());
        List<Part> impactedParts = impactedPartIds.isEmpty()
                ? List.of()
                : partRepository.findAllById(impactedPartIds).stream().filter(p -> !Boolean.TRUE.equals(p.getIsDeleted())).toList();

        int releasedCount = (int) impactedParts.stream().filter(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED).count();
        int underReviewCount = (int) impactedParts.stream().filter(p -> p.getLifecycleState() == LifecycleStateEnum.UNDERREVIEW).count();
        int totalWhereUsed = impactedPartIds.stream()
                .mapToInt(id -> bomLineRepository.findDistinctParentPartIdsByChildPartId(id).size())
                .sum();
        int approximateRisk = Math.min(
                96,
                priorityWeight(valueOf(ecr.getPriority()))
                        + (releasedCount * 18)
                        + (underReviewCount * 10)
                        + (Math.min(totalWhereUsed, 6) * 6)
                        + (impactedPartIds.size() * 4)
        );

        List<ContextualAiFactDto> facts = new ArrayList<>();
        facts.add(fact("Status", valueOf(ecr.getStatus())));
        facts.add(fact("Priority", valueOf(ecr.getPriority())));
        facts.add(fact("Impacted objects", String.valueOf(impactedPartIds.size())));
        facts.add(fact("Released objects", String.valueOf(releasedCount)));
        facts.add(fact("Objects already under review", String.valueOf(underReviewCount)));
        facts.add(fact("Approximate parent impact", String.valueOf(totalWhereUsed)));

        List<String> warnings = new ArrayList<>();
        if (releasedCount > 0) {
            warnings.add("Released objects are in scope, so reviewers should check traceability and downstream approvals.");
        }
        if (totalWhereUsed > 3) {
            warnings.add("Impacted parts already appear in multiple parent structures.");
        }
        if (impactedPartIds.isEmpty()) {
            warnings.add("No impacted objects are listed yet, which makes review quality weaker.");
        }

        List<String> actions = new ArrayList<>();
        if (releasedCount > 0) {
            actions.add("Include at least one reviewer who understands released structure governance.");
        }
        actions.add(approximateRisk >= 70
                ? "Review impact breadth before approving implementation."
                : "Focus the review on scope clarity, affected objects, and implementation readiness.");
        actions.add(totalWhereUsed > 0
                ? "Check where-used evidence for each impacted part."
                : "Confirm the object list is complete before moving forward.");

        String assessment = approximateRisk >= 70
                ? "This ECR has a meaningful review burden because it touches controlled or structurally visible objects."
                : "This ECR looks relatively contained, but reviewers should still verify scope and implementation clarity.";

        return ContextualAiResponseDto.builder()
                .facts(facts)
                .assessment(assessment)
                .recommendedActions(actions)
                .warnings(warnings)
                .confidence(Math.max(68, Math.min(95, approximateRisk)))
                .build();
    }

    public ContextualAiResponseDto getWorkItemSummary(Long workItemId) {
        WorkItem workItem = workItemRepository.findByIdAndIsDeletedFalse(workItemId)
                .orElseThrow(() -> new IllegalArgumentException("Work item not found: " + workItemId));

        Part part = partRepository.findById(workItem.getPartId()).orElse(null);
        PromotionRequest request = promotionRequestRepository.findById(workItem.getPromotionRequestId()).orElse(null);
        int whereUsedCount = part == null ? 0 : bomLineRepository.findDistinctParentPartIdsByChildPartId(part.getId()).size();
        int openChanges = part == null ? 0 : findOpenChangesForPart(part.getId()).size();

        List<ContextualAiFactDto> facts = new ArrayList<>();
        facts.add(fact("Task status", valueOf(workItem.getStatus())));
        if (part != null) {
            facts.add(fact("Object", valueOf(part.getPartNumber()) + " - " + valueOf(part.getName())));
            facts.add(fact("Current state", valueOf(part.getLifecycleState())));
        }
        if (request != null) {
            facts.add(fact("Requested transition", valueOf(request.getFromState()) + " -> " + valueOf(request.getToState())));
            facts.add(fact("Promotion status", valueOf(request.getStatus())));
        }
        if (workItem.getDueAt() != null) {
            facts.add(fact("Due", workItem.getDueAt().format(DATE_TIME)));
        }

        List<String> warnings = new ArrayList<>();
        if (part != null && part.getLifecycleState() == LifecycleStateEnum.UNDERREVIEW) {
            warnings.add("The part is already under review, so approval should be based on completeness rather than further edits.");
        }
        if (whereUsedCount > 0) {
            warnings.add("The part is used in " + whereUsedCount + " parent structure" + (whereUsedCount == 1 ? "" : "s") + ".");
        }
        if (openChanges > 0) {
            warnings.add("There are " + openChanges + " open change request" + (openChanges == 1 ? "" : "s") + " referencing this part.");
        }

        List<String> actions = new ArrayList<>();
        actions.add("Approve only if the requested state change matches the supporting evidence and comments.");
        actions.add("Reject or return for rework if downstream impact is unclear.");
        if (whereUsedCount > 0) {
            actions.add("Check parent usage before approving release or obsolescence.");
        }

        String assessment = (part != null && part.getLifecycleState() == LifecycleStateEnum.RELEASED)
                ? "This review item touches a released object, so the decision should emphasize impact visibility and change discipline."
                : "This review item looks like a normal approval step, so the main question is whether the object is ready for the requested transition.";

        return ContextualAiResponseDto.builder()
                .facts(facts)
                .assessment(assessment)
                .recommendedActions(actions)
                .warnings(warnings)
                .confidence(whereUsedCount > 0 || openChanges > 0 ? 86 : 74)
                .build();
    }

    public ContextualAiResponseDto getDocumentGuidance(Long documentId) {
        WTDocument document = wtDocumentRepository.findByIdAndIsDeletedFalse(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        List<Long> relatedPartIds = wtDocumentRepository.findRelatedPartIds(documentId);
        List<Part> relatedParts = relatedPartIds == null || relatedPartIds.isEmpty()
                ? List.of()
                : partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(relatedPartIds);

        int releasedParts = (int) relatedParts.stream().filter(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED).count();
        int inReviewParts = (int) relatedParts.stream().filter(p -> p.getLifecycleState() == LifecycleStateEnum.UNDERREVIEW).count();

        List<ContextualAiFactDto> facts = new ArrayList<>();
        facts.add(fact("Lifecycle state", valueOf(document.getLifecycleState())));
        facts.add(fact("Version", valueOf(document.getRevision()) + "." + valueOf(document.getIteration())));
        facts.add(fact("Document type", valueOf(document.getDocType())));
        facts.add(fact("Related parts", String.valueOf(relatedParts.size())));
        facts.add(fact("Released related parts", String.valueOf(releasedParts)));

        List<String> warnings = new ArrayList<>();
        List<String> actions = new ArrayList<>();
        String state = valueOf(document.getLifecycleState()).toUpperCase(Locale.ENGLISH);
        String assessment;
        int confidence = 79;

        if ("RELEASED".equals(state)) {
            assessment = relatedParts.isEmpty()
                    ? "This released document is stable, so updates should be deliberate and revision-controlled."
                    : "This released document supports managed product data, so edits should be handled as a controlled revision.";
            actions.add("Create a revised working copy before changing released content.");
            actions.add("Verify which parts or change objects depend on this document.");
            warnings.add("Released documents should not be edited as ad-hoc working copies.");
            confidence = 88;
        } else if ("UNDERREVIEW".equals(state)) {
            assessment = "This document is already in review, so the next decision should focus on approval readiness and referenced product data.";
            actions.add("Check reviewer comments and linked part readiness before further edits.");
            actions.add("Complete the current review cycle before expanding scope.");
            warnings.add("Parallel edits during review can weaken traceability.");
            confidence = 85;
        } else if ("OBSOLETE".equals(state)) {
            assessment = "This document is obsolete, so the main question is whether it still needs traceable references or a replacement.";
            actions.add("Confirm replacement or archival intent before reusing this document.");
            actions.add("Inspect linked parts before removing access or visibility.");
            warnings.add("Obsolete documents may still be referenced by released parts.");
            confidence = 84;
        } else {
            assessment = relatedParts.isEmpty()
                    ? "This in-work document is ready for normal editing and review preparation."
                    : "This in-work document can still change, but linked parts mean content quality matters before review.";
            actions.add("Update the document content and metadata while it is still in work.");
            actions.add("Submit for review once references, naming, and scope are stable.");
            confidence = 75;
        }

        if (releasedParts > 0) {
            warnings.add("Linked to " + releasedParts + " released part" + (releasedParts == 1 ? "" : "s") + ".");
        }
        if (inReviewParts > 0) {
            warnings.add("Some linked parts are already under review.");
        }
        if (document.getCheckedOutBy() != null) {
            warnings.add("Currently checked out by " + document.getCheckedOutBy() + ".");
        }

        return ContextualAiResponseDto.builder()
                .facts(facts)
                .assessment(assessment)
                .recommendedActions(actions)
                .warnings(warnings)
                .confidence(confidence)
                .build();
    }

    private List<ChangeRequest> findOpenChangesForPart(Long partId) {
        return changeRequestRepository.findByImpactedPartId(String.valueOf(partId)).stream()
                .filter(cr -> cr.getStatus() != ChangeRequestStatus.CLOSED && cr.getStatus() != ChangeRequestStatus.REJECTED)
                .collect(Collectors.toList());
    }

    private List<Long> parseIds(String csv) {
        if (csv == null || csv.isBlank()) {
            return Collections.emptyList();
        }
        return List.of(csv.split(",")).stream()
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(Long::valueOf)
                .toList();
    }

    private int priorityWeight(String priority) {
        return switch (priority) {
            case "CRITICAL" -> 30;
            case "HIGH" -> 22;
            case "LOW" -> 8;
            default -> 15;
        };
    }

    private ContextualAiFactDto fact(String label, String value) {
        return ContextualAiFactDto.builder()
                .label(label)
                .value(value)
                .build();
    }

    private String valueOf(Object value) {
        return value == null ? "-" : String.valueOf(value);
    }
}
