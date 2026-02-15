# Windchill-like PLM Workspace

This repository contains a **Windchill-like PLM (Product Lifecycle Management) workspace** built with Spring Boot, React, and Docker.

It is a personal learning/demo project and not affiliated with or endorsed by PTC. "Windchill" is a registered trademark of PTC Inc.; this project only recreates similar UI/UX concepts for educational purposes.

## Features

- Login + admin user provisioning
- PLM Workspace with:
  - Contexts (containers) and folder hierarchy
  - Parts with lifecycle (INWORK, UNDERREVIEW, RELEASED, OBSOLETE)
  - Revisioning (A, B, C...) and iterations
  - BOM editor (parent → child lines) with Find Number and quantities
  - Where Used: see parent assemblies that reference a part
  - Audit trail per part
- Context team management and ACL (who can see/edit)
- Docker-based local environment (backend + frontend + DB)

## Quick start

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app

# Run everything
docker-compose up -d --build
```

Then open `http://localhost:8080` and login with:

- **User**: `admin`
- **Password**: `admin123`

## Workspace walkthrough

1. Choose a **Context** on the left.
2. Use the **Folders** tree to organize parts.
3. In **Parts**, create parts and open a part to:
   - Edit details and lifecycle
   - Build a BOM structure in the **Structure** tab
   - See audit in **History**
   - Browse **Versions** and **Where Used** in **Related Objects**

## Docs

More details live under [`docs/`](./docs):

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md)
- [`docs/PLM_CORE_SPINE.md`](./docs/PLM_CORE_SPINE.md)
- [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md)

Troubleshooting and older fix logs are being consolidated into `docs/` from the root `*_FIX_*.md` files.
