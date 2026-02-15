# PLM Core Spine (Windchill-like)

This branch adds the foundational Windchill-like backbone so the app behaves like a real PLM system rather than only CRUD.

## What’s included

- Context containers: Product / Project / Library
- Folder hierarchy per context (root + nested paths)
- Part object with lifecycle (INWORK → UNDERREVIEW → RELEASED → OBSOLETE)
- Revisioning: RELEASED parts are immutable, use **Revise** to create next revision
- BOM: parent/child relationships with qty/unit/find number
- Audit logs for key events

## New endpoints

- `POST /api/v1/plm/contexts`
- `GET /api/v1/plm/contexts`
- `POST /api/v1/plm/contexts/{contextId}/folders`
- `GET /api/v1/plm/contexts/{contextId}/folders`
- `POST /api/v1/plm/parts`
- `GET /api/v1/plm/parts?contextId={id}`
- `POST /api/v1/plm/parts/{id}/promote?target=UNDERREVIEW|RELEASED|OBSOLETE`
- `POST /api/v1/plm/parts/{id}/revise`
- `POST /api/v1/plm/parts/{parentId}/bom`
- `GET /api/v1/plm/parts/{parentId}/bom`
- `DELETE /api/v1/plm/bom-lines/{id}`
- `GET /api/v1/plm/audit?entityType=PART&entityId={id}`

## Run

```bash
docker-compose up -d --build
```

Open Swagger:
- `http://localhost:8080/swagger-ui/index.html`
