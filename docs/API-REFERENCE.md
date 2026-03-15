# API Reference

All endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

Base URL: `http://localhost:8080/api` (dev) | `https://<your-domain>/api` (prod)

---

## Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/logout` | Logout |
| `GET`  | `/auth/me` | Current user info |

---

## Parts

| Method | Path | Description |
|---|---|---|
| `GET`    | `/parts` | List all parts (supports `?search=`, `?state=`, `?type=`) |
| `POST`   | `/parts` | Create part |
| `GET`    | `/parts/{id}` | Get part by ID |
| `PUT`    | `/parts/{id}` | Update part |
| `DELETE` | `/parts/{id}` | Delete part |
| `POST`   | `/parts/{id}/checkout` | Check out (lock) |
| `POST`   | `/parts/{id}/checkin` | Check in (unlock + iteration++) |
| `POST`   | `/parts/{id}/undo-checkout` | Discard checkout |
| `POST`   | `/parts/{id}/promote` | Lifecycle transition |
| `POST`   | `/parts/{id}/revise` | Create new revision |
| `GET`    | `/parts/{id}/bom` | Get BOM structure |
| `POST`   | `/parts/{id}/bom` | Add BOM line |
| `PUT`    | `/parts/{id}/bom/{bomId}` | Update BOM line |
| `DELETE` | `/parts/{id}/bom/{bomId}` | Remove BOM line |
| `GET`    | `/parts/{id}/where-used` | Get parent assemblies |

---

## Documents

| Method | Path | Description |
|---|---|---|
| `GET`    | `/documents` | List documents |
| `POST`   | `/documents` | Create document |
| `GET`    | `/documents/{id}` | Get document |
| `PUT`    | `/documents/{id}` | Update document |
| `DELETE` | `/documents/{id}` | Delete document |
| `POST`   | `/documents/{id}/checkout` | Check out |
| `POST`   | `/documents/{id}/checkin` | Check in |
| `POST`   | `/documents/{id}/promote` | Lifecycle transition |

---

## Products

| Method | Path | Description |
|---|---|---|
| `GET`    | `/products` | List products |
| `POST`   | `/products` | Create product |
| `GET`    | `/products/{id}` | Get product |
| `PUT`    | `/products/{id}` | Update |
| `DELETE` | `/products/{id}` | Delete |

---

## Projects

| Method | Path | Description |
|---|---|---|
| `GET`    | `/projects` | List projects |
| `POST`   | `/projects` | Create project |
| `GET`    | `/projects/{id}` | Get project |
| `PUT`    | `/projects/{id}` | Update |
| `DELETE` | `/projects/{id}` | Delete |

---

## Changes

| Method | Path | Description |
|---|---|---|
| `GET`    | `/changes/ecr` | List ECRs |
| `POST`   | `/changes/ecr` | Create ECR |
| `GET`    | `/changes/ecr/{id}` | Get ECR |
| `PUT`    | `/changes/ecr/{id}` | Update ECR |
| `POST`   | `/changes/ecr/{id}/promote` | Promote ECR state |
| `GET`    | `/changes/tasks` | List Change Tasks |
| `GET`    | `/changes/tasks/{id}` | Get Change Task |
| `PUT`    | `/changes/tasks/{id}` | Update Change Task |

---

## Work Items (Worklist)

| Method | Path | Description |
|---|---|---|
| `GET`    | `/work-items` | List (supports `?assignedTo=`, `?completed=`) |
| `GET`    | `/work-items/{id}` | Get work item |
| `PUT`    | `/work-items/{id}` | Update work item |
| `POST`   | `/work-items/{id}/complete` | Mark complete |
| `POST`   | `/work-items/{id}/delegate` | Delegate to another user |

---

## Folders

| Method | Path | Description |
|---|---|---|
| `GET`    | `/folders` | List all folders (flat) |
| `POST`   | `/folders` | Create folder |
| `GET`    | `/folders/{id}` | Get folder |
| `PUT`    | `/folders/{id}` | Update folder |
| `DELETE` | `/folders/{id}` | Delete folder |
| `GET`    | `/folders/{id}/contents` | List objects inside folder |
| `POST`   | `/folders/{id}/add` | Move object into folder |

---

## Search

| Method | Path | Description |
|---|---|---|
| `GET`  | `/search?q=ENG&type=PART&state=RELEASED` | Cross-type search |
| `GET`  | `/search/{objectType}?q=ENG` | Type-scoped search |

**Response shape:**
```json
{
  "query": "ENG",
  "type": "PART",
  "state": "RELEASED",
  "count": 3,
  "results": [
    {
      "objectType": "PART",
      "id": 42,
      "number": "ENG-001",
      "name": "Engine Housing",
      "lifecycleState": "RELEASED",
      "revision": "B",
      "iteration": "3",
      "updatedAt": "2024-05-01T12:00:00"
    }
  ]
}
```

---

## Notifications

| Method | Path | Description |
|---|---|---|
| `GET`  | `/notifications` | List notifications |
| `PUT`  | `/notifications/{id}/read` | Mark as read |
| `PUT`  | `/notifications/read-all` | Mark all read |

---

## Audit Log

| Method | Path | Description |
|---|---|---|
| `GET`  | `/audit-log` | Paginated audit events (supports `?objectType=`, `?objectId=`, `?action=`, `?username=`) |

---

## AI

| Method | Path | Description |
|---|---|---|
| `POST` | `/ai/impact-analysis` | Run BOM impact analysis |
| `POST` | `/ai/chat` | Chat with PLM AI assistant |
| `GET`  | `/ai/suggestions/{partId}` | Get AI suggestions for a part |

---

## Dashboard

| Method | Path | Description |
|---|---|---|
| `GET`  | `/dashboard/stats` | Summary counts |
| `GET`  | `/dashboard/activity` | Recent activity feed |
