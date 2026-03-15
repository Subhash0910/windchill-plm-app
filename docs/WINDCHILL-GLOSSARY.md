# Windchill Glossary

Key terms used throughout this PLM application, with their real Windchill equivalents.

---

## Object Terms

| Term | Windchill Equivalent | Meaning |
|---|---|---|
| Part | `WTPart` | A physical or logical component managed in the BOM |
| BOM Line | `WTPartUsageLink` | A parent–child relationship between two Parts with quantity data |
| Where Used | Reverse BOM | Shows which assemblies use a given Part |
| Document | `WTDocument` | A managed file (drawing, spec, report) with lifecycle and versioning |
| Product | `WTProduct` | A named context grouping Parts and Documents |
| Project | `WTProject` | A time-boxed effort with tasks and milestones |
| ECR | `WTChangeRequest` | Engineering Change Request — initiates a formal change |
| ECN | `WTChangeNotice` | Engineering Change Notice — authorises implementation |
| Change Task | `WTChangeActivity` | A unit of work to implement a change |
| Work Item | `WorkItem` | An action in a user’s Worklist (review, approve, complete task) |
| Folder | `WTFolder` | A container in the Product Library cabinet tree |
| Cabinet | Root Folder | Top-level folder; usually named after a product or team |

---

## Process Terms

| Term | Meaning |
|---|---|
| **Checkout** | Lock an object for editing. Creates a working copy. Only the lock holder can edit. |
| **Checkin** | Commit edits. Releases the lock and increments the iteration counter. |
| **Undo Checkout** | Discard working copy and release lock without incrementing iteration. |
| **Promote** | Transition an object to the next lifecycle state (e.g., INWORK → UNDER_REVIEW). |
| **Revise** | Create a new major revision (`A` → `B`) while keeping the previous revision accessible. |
| **Iteration** | A minor version within a revision. Incremented on every Checkin. |
| **Revision** | A major version label (`A`, `B`, `C`…). Only changes on Revise. |
| **Impact Analysis** | AI-powered analysis of how changing a Part affects other assemblies, documents, and ECRs. |

---

## UI Terms

| Term | Meaning |
|---|---|
| **Worklist** | A personal inbox of action items assigned to the current user. |
| **Product Library** | The main Parts table — the primary navigation destination in Windchill. |
| **Folder Browser** | A tree-based explorer of cabinets and folders. |
| **Change Board** | The group responsible for reviewing and approving ECRs. |
| **Context** | The Product that scopes an object’s visibility and versioning. |
| **Navigator** | The left sidebar providing quick access to PLM sections. |
| **Top Navigator** | The horizontal top bar with primary menu items (matches this app’s `wc-topnav`). |

---

## Acronyms

| Acronym | Expansion |
|---|---|
| PLM | Product Lifecycle Management |
| BOM | Bill of Materials |
| ECR | Engineering Change Request |
| ECN | Engineering Change Notice |
| CAD | Computer-Aided Design |
| PDM | Product Data Management |
| MBE | Model-Based Enterprise |
| UI | User Interface |
| JWT | JSON Web Token (used for authentication) |
