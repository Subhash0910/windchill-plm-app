# Object Type Reference

This document describes every managed object type in the PLM system, its key attributes, and its corresponding Windchill analogy.

---

## Part (`WTPart`)

The fundamental unit of product structure. A Part represents any physical or logical component in the BOM.

| Attribute | Type | Notes |
|---|---|---|
| `partNumber` | String | Unique identifier, e.g. `ENG-001-A` |
| `name` | String | Human-readable name |
| `description` | String | Free text |
| `revision` | String | `A`, `B`, `C`… incremented on Revise |
| `iteration` | Integer | 1-based, incremented on Checkin |
| `lifecycleState` | Enum | See [Lifecycle States](LIFECYCLE-STATES.md) |
| `checkedOut` | Boolean | True when locked for editing |
| `checkedOutBy` | String | Username of lock holder |
| `source` | Enum | `MAKE`, `BUY`, `MAKE_OR_BUY` |
| `type` | Enum | `ASSEMBLY`, `COMPONENT`, `RAW_MATERIAL` |
| `unit` | String | `EA`, `KG`, `M`… |
| `weight` | Decimal | Optional |
| `contextId` | Long | FK to Product context |
| `folderId` | Long | FK to Folder |
| `createdBy` | String | Username |
| `updatedAt` | Timestamp | Last modification |

**BOM Lines** connect Parts in a parent–child tree. Each `BomLine` carries:
`quantity`, `unit`, `findNumber`, `refDesignator`, `childPartId`, `parentPartId`.

---

## Document (`WTDocument`)

Managed documents such as CAD drawings, specifications, and reports.

| Attribute | Type | Notes |
|---|---|---|
| `docNumber` | String | Unique identifier, e.g. `DOC-2024-001` |
| `title` | String | |
| `type` | Enum | `SPECIFICATION`, `DRAWING`, `REPORT`, `PROCEDURE`, `OTHER` |
| `revision` | String | |
| `iteration` | Integer | |
| `lifecycleState` | Enum | |
| `checkedOut` | Boolean | |
| `fileUrl` | String | Attachment link |
| `folderId` | Long | |

---

## Product (`WTProductInstance`)

A logical product configuration that groups Parts and Documents in a named context.

| Attribute | Type | Notes |
|---|---|---|
| `productNumber` | String | |
| `name` | String | |
| `revision` | String | |
| `lifecycleState` | Enum | |
| `releaseDate` | Date | |
| `projectId` | Long | |

---

## Project (`WTProject`)

A time-boxed effort with participants, tasks, and milestones.

| Attribute | Type | Notes |
|---|---|---|
| `projectNumber` | String | |
| `name` | String | |
| `status` | String | `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED` |
| `startDate` | Date | |
| `endDate` | Date | |
| `managerId` | Long | |

---

## Change Request / ECR (`WTChangeRequest`)

An Engineering Change Request initiates a formal change process.

| Attribute | Type | Notes |
|---|---|---|
| `ecrNumber` | String | Auto-generated, e.g. `ECR-2024-001` |
| `title` | String | |
| `state` | Enum | `OPEN` → `UNDER_REVIEW` → `APPROVED` / `REJECTED` |
| `priority` | Enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `reason` | String | |
| `affectedParts` | List | FK list |

---

## Change Task

A unit of implementation work spawned from an ECR.

| Attribute | Type | Notes |
|---|---|---|
| `taskNumber` | String | |
| `title` | String | |
| `assignedTo` | String | |
| `status` | Enum | `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `dueDate` | Date | |
| `ecrId` | Long | |

---

## Work Item

An action item in a user’s Worklist — can be linked to any object type.

| Attribute | Type | Notes |
|---|---|---|
| `type` | Enum | `REVIEW`, `APPROVE`, `COMPLETE_TASK`, `SIGN_OFF`, `OTHER` |
| `title` | String | |
| `assignedTo` | String | |
| `priority` | Enum | |
| `dueDate` | Date | |
| `relatedObjectType` | String | `ECR`, `PART`, `DOCUMENT`… |
| `relatedObjectId` | Long | |
| `completed` | Boolean | |

---

## Folder / Cabinet

| Attribute | Type | Notes |
|---|---|---|
| `name` | String | |
| `parentId` | Long | null = root cabinet |
| `contextId` | Long | |
| `createdBy` | String | |
