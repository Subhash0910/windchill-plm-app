# Lifecycle States

This document defines the lifecycle state machines used across all managed objects.

---

## Part Lifecycle

```
INWORK ───────► UNDER_REVIEW ───► RELEASED ───► OBSOLETE
            └──────► REJECTED ───► INWORK (iterate)
```

| State | Description |
|---|---|
| `INWORK` | Default. Object is editable. Checkin/checkout operations available. |
| `UNDER_REVIEW` | Submitted for review. Object is read-only. |
| `RELEASED` | Approved for use in production. Read-only. |
| `OBSOLETE` | Superseded by a newer revision. |
| `CANCELLED` | Abandoned before release. |
| `REJECTED` | Failed review. Returns to INWORK on next iteration. |

### Promote Transitions

| From | To | Action |
|---|---|---|
| `INWORK` | `UNDER_REVIEW` | Submit for review |
| `UNDER_REVIEW` | `RELEASED` | Approve |
| `UNDER_REVIEW` | `REJECTED` | Reject |
| `REJECTED` | `INWORK` | Iterate (checkin creates new iteration) |
| `RELEASED` | `OBSOLETE` | Obsolete |

### Revise
Creates a new Part with `revision` incremented (`A` → `B`), state reset to `INWORK`, iteration reset to `1`. Previous revision remains `RELEASED`.

---

## Document Lifecycle

Identical to Part lifecycle. Same states and transitions apply.

---

## ECR (Change Request) States

```
OPEN ──────► UNDER_REVIEW ───► APPROVED ───► IMPLEMENTED
                         └──────► REJECTED
         └───────────────────────────► CANCELLED
```

| State | Description |
|---|---|
| `OPEN` | New ECR, under authoring. |
| `UNDER_REVIEW` | Submitted to change board. |
| `APPROVED` | Change board approved. Implementation begins. |
| `REJECTED` | Change board rejected. |
| `IMPLEMENTED` | All change tasks complete, ECR closed. |
| `CANCELLED` | Withdrawn by originator. |

---

## Change Task States

| State | Description |
|---|---|
| `OPEN` | Assigned, not started. |
| `IN_PROGRESS` | Assignee is working. |
| `COMPLETED` | All changes applied and checked in. |
| `CANCELLED` | Task no longer needed. |

---

## Work Item States

| State | Description |
|---|---|
| `open` (completed=false) | Active, in user’s worklist. |
| `completed` (completed=true) | Closed by the assignee. |
| `overdue` | Due date has passed and item not completed. |

---

## Project Status

| Status | Description |
|---|---|
| `ACTIVE` | In progress. |
| `ON_HOLD` | Paused. |
| `COMPLETED` | All deliverables done. |
| `CANCELLED` | Project cancelled. |

---

## Frontend Badge Mapping

The `windchill-theme.css` defines CSS classes for each state:

```css
.wc-badge--inwork      /* INWORK */
.wc-badge--review      /* UNDER_REVIEW */
.wc-badge--released    /* RELEASED */
.wc-badge--obsolete    /* OBSOLETE */
.wc-badge--cancelled   /* CANCELLED */
.wc-badge--approved    /* APPROVED */
.wc-badge--rejected    /* REJECTED */
.wc-badge--pending     /* PENDING / OPEN */
.wc-badge--open        /* OPEN (ECR) */
.wc-badge--closed      /* CLOSED / COMPLETED */
```

Usage in JSX:
```jsx
<span className={`wc-badge wc-badge--${part.lifecycleState.toLowerCase()}`}>
  {part.lifecycleState}
</span>
```
