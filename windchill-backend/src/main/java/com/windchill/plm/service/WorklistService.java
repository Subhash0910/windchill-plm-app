package com.windchill.plm.service;

import com.windchill.plm.model.WorkItem;
import com.windchill.plm.repository.WorkItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * WorklistService — aggregates WorkItems for a given assignee and provides
 * type-aware routing information for the frontend.
 *
 * Each work item is enriched with:
 *  - routePath : the frontend route to navigate to on click
 *  - priorityLabel : human-readable priority
 *  - overdue : boolean flag if dueDate has passed
 */
@Service
@RequiredArgsConstructor
public class WorklistService {

    private final WorkItemRepository workItemRepository;

    // ----------------------------------------------------------------
    //  Public API
    // ----------------------------------------------------------------

    /** All open work items assigned to the given username. */
    public List<Map<String, Object>> getWorklistForUser(String username) {
        return workItemRepository.findByAssignedToAndCompletedFalseOrderByDueDateAsc(username)
                .stream()
                .map(this::enrich)
                .collect(Collectors.toList());
    }

    /** All work items (any state) assigned to the given username. */
    public List<Map<String, Object>> getAllForUser(String username) {
        return workItemRepository.findByAssignedToOrderByCreatedAtDesc(username)
                .stream()
                .map(this::enrich)
                .collect(Collectors.toList());
    }

    /** Summary counts per type for the dashboard widget. */
    public Map<String, Object> getSummaryForUser(String username) {
        List<WorkItem> items = workItemRepository.findByAssignedToAndCompletedFalseOrderByDueDateAsc(username);
        Map<String, Long> byType = items.stream()
                .collect(Collectors.groupingBy(
                        wi -> wi.getType() != null ? wi.getType().name() : "OTHER",
                        Collectors.counting()));
        long overdue = items.stream().filter(this::isOverdue).count();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total",   items.size());
        summary.put("overdue", overdue);
        summary.put("byType",  byType);
        return summary;
    }

    /** Complete a work item and record completedAt. */
    public WorkItem complete(Long id, String completedBy) {
        WorkItem wi = workItemRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("WorkItem not found: " + id));
        wi.setCompleted(true);
        wi.setCompletedBy(completedBy);
        wi.setCompletedAt(java.time.LocalDateTime.now());
        return workItemRepository.save(wi);
    }

    /** Delegate a work item to a different assignee. */
    public WorkItem delegate(Long id, String newAssignee, String delegatedBy) {
        WorkItem wi = workItemRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("WorkItem not found: " + id));
        wi.setDelegatedFrom(wi.getAssignedTo());
        wi.setAssignedTo(newAssignee);
        wi.setDelegatedBy(delegatedBy);
        return workItemRepository.save(wi);
    }

    // ----------------------------------------------------------------
    //  Helpers
    // ----------------------------------------------------------------

    private Map<String, Object> enrich(WorkItem wi) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           wi.getId());
        m.put("type",         wi.getType() != null ? wi.getType().name() : null);
        m.put("title",        wi.getTitle());
        m.put("description",  wi.getDescription());
        m.put("assignedTo",   wi.getAssignedTo());
        m.put("priority",     wi.getPriority() != null ? wi.getPriority().name() : null);
        m.put("priorityLabel",priorityLabel(wi));
        m.put("dueDate",      wi.getDueDate() != null ? wi.getDueDate().toString() : null);
        m.put("overdue",      isOverdue(wi));
        m.put("completed",    wi.isCompleted());
        m.put("completedAt",  wi.getCompletedAt() != null ? wi.getCompletedAt().toString() : null);
        m.put("completedBy",  wi.getCompletedBy());
        m.put("relatedObjectType", wi.getRelatedObjectType());
        m.put("relatedObjectId",   wi.getRelatedObjectId());
        m.put("routePath",    buildRoutePath(wi));
        m.put("createdAt",    wi.getCreatedAt() != null ? wi.getCreatedAt().toString() : null);
        return m;
    }

    private boolean isOverdue(WorkItem wi) {
        if (wi.isCompleted() || wi.getDueDate() == null) return false;
        return wi.getDueDate().isBefore(java.time.LocalDate.now());
    }

    private String priorityLabel(WorkItem wi) {
        if (wi.getPriority() == null) return "Normal";
        return switch (wi.getPriority().name()) {
            case "CRITICAL" -> "🔴 Critical";
            case "HIGH"     -> "🟠 High";
            case "MEDIUM"   -> "🟡 Medium";
            case "LOW"      -> "🟢 Low";
            default         -> wi.getPriority().name();
        };
    }

    private String buildRoutePath(WorkItem wi) {
        if (wi.getRelatedObjectId() == null) return "/plm/worklist";
        String type = wi.getRelatedObjectType();
        if (type == null) return "/plm/worklist";
        return switch (type.toUpperCase()) {
            case "ECR"      -> "/plm/changes/ecr/"  + wi.getRelatedObjectId();
            case "PART"     -> "/plm/parts/"        + wi.getRelatedObjectId();
            case "DOCUMENT" -> "/plm/documents/"    + wi.getRelatedObjectId();
            case "PRODUCT"  -> "/plm/products/"     + wi.getRelatedObjectId();
            case "PROJECT"  -> "/plm/projects/"     + wi.getRelatedObjectId();
            default         -> "/plm/worklist";
        };
    }
}
