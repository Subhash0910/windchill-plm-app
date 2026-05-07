# Customization Guide

This platform includes a customization layer modelled on how Windchill customization works in the real world. As an ADMIN, you can extend and configure the platform without touching source code.

All customization tools are under the **Admin** section of the sidebar (requires ADMIN role).

---

## 1. Action Model Registry

**Route:** `/plm/admin/actions`

The Action Model Registry controls which toolbar buttons appear on each PLM object type, and what happens when a user clicks them.

In real Windchill, this is configured in `site_actionmodels.xml` — a large XML file that system administrators maintain. This platform gives you a UI to do the same thing dynamically, stored in the database.

### What an Action defines

| Field | Description |
|---|---|
| **Action Key** | Unique ID, e.g. `PROMOTE_TO_ECO` |
| **Label** | Button text shown to the user |
| **Object Type** | Which type this action applies to (e.g. `ECR`, `Part`, `Document`) |
| **Section** | `PRIMARY` (always visible), `SECONDARY` (always visible), or `OVERFLOW` (in `…` menu) |
| **Processor Class** | Java class that handles this action on the backend |
| **Method** | Java method within that class |
| **HTTP Endpoint** | REST endpoint called when the action is triggered |
| **Role Gate** | Minimum role required (VIEWER / ENGINEER / MANAGER / ADMIN) |
| **Lifecycle Gate** | Lifecycle state(s) in which this action is available |
| **Enabled** | Toggle to activate/deactivate without deleting |

### XML Export

Click **Export XML** to download a `site_actionmodels.xml` file in the real Windchill format. This is useful for:
- Documenting what you've configured
- Importing into a real Windchill environment (with mapping adjustments)
- Learning the Windchill XML schema

### Typical usage

1. Navigate to `/plm/admin/actions`
2. Click **New Action**
3. Fill in the key, label, object type, section, and role gate
4. Toggle **Enabled** on
5. The action appears in the toolbar the next time an object of that type is viewed

---

## 2. Lifecycle Designer

**Route:** `/plm/admin/lifecycle`

The Lifecycle Designer lets you create and edit lifecycle state machines for PLM object types.

### Concepts

- **State** — a named phase an object can be in (e.g. `INWORK`, `RELEASED`)
- **Transition** — an arrow from one state to another with an optional role gate
- **Entry actions** — what happens automatically when an object enters a state (e.g. lock for editing, send notification)

### How to use

1. Navigate to `/plm/admin/lifecycle`
2. Select an existing lifecycle or create a new one
3. Add states using the visual canvas
4. Draw transitions between states by dragging
5. Set role gates on transitions to restrict who can trigger them
6. Assign the lifecycle to an object type in the Type Registry

### Built-in lifecycles

The platform ships with standard lifecycles:
- `PLM_PART_LIFECYCLE` — INWORK → UNDERREVIEW → RELEASED → OBSOLETE
- `PLM_DOCUMENT_LIFECYCLE` — same pattern for WTDocument
- `PLM_ECR_LIFECYCLE` — DRAFT → SUBMITTED → UNDERREVIEW → APPROVED / REJECTED
- `PLM_ECO_LIFECYCLE` — DRAFT → OPEN → COMPLETE → CANCELLED

---

## 3. Type Registry

**Route:** `/plm/admin/types`

The Type Registry is where you define custom PLM object types and their metadata schema.

In real Windchill, all business objects inherit from `WTObject`. Custom types are registered in the type system and get their own attribute definitions, lifecycle assignments, and action models.

### What a Type defines

| Field | Description |
|---|---|
| **Type Name** | Internal identifier, e.g. `CUSTOM_TOOL_PART` |
| **Display Name** | Human-readable label |
| **Parent Type** | Inherits from (e.g. `Part`, `WTDocument`) |
| **Lifecycle** | Which lifecycle to apply |
| **Attributes** | List of IBA definitions (name, data type, required flag) |
| **Icon** | Visual indicator in the UI |

### Typical usage

1. Navigate to `/plm/admin/types`
2. Click **Register Type**
3. Choose a parent type and assign a lifecycle
4. Add custom attributes (IBAs)
5. The new type is available when creating objects

---

## 4. Windchill System Reference

**Route:** `/plm/admin/system`

A reference page explaining Windchill-specific terminology, architecture concepts, and how this platform maps to real Windchill behavior. Useful for:
- Learning PLM vocabulary before a job interview
- Understanding the conceptual difference between ECR and ECO
- Seeing how Windchill's context model (Products, Projects, Libraries) works

---

## How Customization Fits the Architecture

```
Database-backed registry
        ↓
  Backend service layer reads registry at runtime
        ↓
  Frontend fetches action model / type metadata via REST API
        ↓
  Toolbar rendered dynamically — no code change required
```

This mirrors how real Windchill customization works: system administrators configure the platform's behavior through XML files and admin UIs without touching Java source code. The Java source code (`windchill-backend/backend-service/`) provides the processor classes that actions invoke — those still require code changes for truly custom behavior.

---

## What Requires Code Changes

Some customizations still require editing source code:

| Customization | Where |
|---|---|
| New processor class for an action | `backend-service/src/.../service/` |
| New REST endpoint for an action | `backend-api/src/.../controller/` |
| New IBA data type | `backend-domain/src/.../domain/` |
| New frontend page | `windchill-frontend/src/pages/plm/` |
| New sidebar nav entry | `windchill-frontend/src/components/plm/NavigatorPanel.jsx` |

See [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for the full module map.
