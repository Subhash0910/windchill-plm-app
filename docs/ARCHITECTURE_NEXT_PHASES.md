# Architecture Plan — Next Phases
**Date:** 2026-05-06
**Current branch:** `feature/ai-impact-engine`
**Phase:** Post-GraphAnalysisService fix

---

## State Summary

| Layer | Status | Gap |
|-------|--------|-----|
| AIImpactServiceImpl | ✅ Conflict + compliance done | — |
| GraphAnalysisService | ✅ Conflict + compliance done | — |
| ImpactAnalyzerService | ✅ reads from GraphAnalysisService | No changes needed |
| ChangeRequestRepository | ✅ `findActiveChangeRequests()` | — |
| AIImpactAnalysis DTO | ✅ new fields added | — |
| ML Service (FastAPI) | ✅ `/predict-risk` exists | NOT in docker-compose |
| Frontend ImpactPreview | ⚠️ reads basic fields | Missing: conflict numbers, compliance |
| CI Pipeline | ❌ No `.github/workflows/` | Phase 5 blocker |
| Agentic Change Assistant | ❌ Not started | Post-CI |

---

## Phase A: Frontend AI Wiring (~45 min)

### A1. Update ImpactPreview.jsx to show new backend fields

The backend now returns `conflictingChangeNumbers`, `hasComplianceIssues`, and `complianceWarnings` in the `AIImpactAnalysis` response. The frontend transform function at line 56 of `ImpactPreview.jsx` needs to ingest these.

**Changes:**
1. Add to the `graphAnalysis` mapping: `conflictingChangeNumbers: backendData.conflictingChangeNumbers || []`
2. Add top-level fields: `hasComplianceIssues: backendData.hasComplianceIssues || false`, `complianceWarnings: backendData.complianceWarnings || []`
3. Add a "Compliance Issues" section (yellow banner) when `hasComplianceIssues` is true
4. Show conflicting ECR numbers in the Conflicts stat (clickable, link to ECR page)
5. Add `conflictingChangeNumbers` to the blockers section when conflicts exist

**Files:** `ImpactPreview.jsx`, `ImpactPreview.css`

### A2. Wire ImpactPreview into PartDetailPage

The PartDetailPage should show an "Analyze Impact" button that opens the ImpactPreview in a panel or modal. Currently ImpactPreview takes `partId` and `changeType` props — these need to be passed from the part detail context.

**Files:** `plm/PartDetailPage.jsx` or wherever part actions live

### A3. Wire ImpactPreview into ECR creation flow

When a user selects parts for an ECR, the ImpactPreview should auto-trigger analysis. This is already supported via the `triggerAnalysis` prop — just wire it into the ECR creation form.

---

## Phase B: ML Service in Docker Compose (~20 min)

### B1. Add ml-service to docker-compose.yml

```yaml
ml-service:
  build:
    context: ./ml-service
    dockerfile: Dockerfile
  container_name: windchill-ml-service
  ports:
    - "5000:5000"
  environment:
    MODEL_PATH: /app/models/risk_model.pkl
  volumes:
    - ml_models:/app/models
  networks:
    - windchill-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

And add `ml_models:` to volumes. Wire backend's `depends_on` to include ml-service.

### B2. Verify end-to-end

```bash
docker-compose up -d --build
docker-compose ps  # should show 5 services healthy
curl http://localhost:5000/health
curl http://localhost:8080/api/v1/ai/health
```

---

## Phase C: CI/CD Pipeline (~30 min)

### C1. GitHub Actions workflow

Create `.github/workflows/ci.yml`:
- **Backend job:** Maven compile + test (JaCoCo 80% gate) + package
- **Frontend job:** npm install + build + Jest tests (70% gate)
- **ML job:** pytest (80% gate)
- **Docker job:** Build all 4 images (backend, frontend, ml-service) — push on main

### C2. JaCoCo configuration

Add JaCoCo plugin to parent POM with coverage gates:
- Domain: 90%
- Application: 80%
- Infrastructure: 70%
- API: 80%

---

## Phase D: Agentic Change Assistant (~2-3 hours, post-CI)

This is the capstone feature. Architecture:

```
ECR submitted
  → AIImpactService.analyzeImpact(partId, changeType)
  → Random Forest scores affected parts (ML Service)
  → GraphAnalysisService provides structural context
  → LangChain4j Agent loop:
      1. Query Neo4j graph for design rationale
      2. Ollama/Gemini generates impact summary in natural language
      3. Compliance rules checked against regulatory DB
  → Pre-filled ECN draft created
  → Surfaces in user's worklist
  → Engineer approves → ECN lifecycle advances
```

### D1. Neo4j Community container

Add to docker-compose:
```yaml
neo4j:
  image: neo4j:community
  environment:
    NEO4J_AUTH: neo4j/${NEO4J_PASSWORD:-password}
  ports:
    - "7474:7474"
    - "7687:7687"
  volumes:
    - neo4j_data:/data
  networks:
    - windchill-network
```

### D2. LangChain4j integration

Add dependency to `backend-service/pom.xml`:
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-spring-boot-starter</artifactId>
    <version>1.0.0-beta1</version>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ollama</artifactId>
    <version>1.0.0-beta1</version>
</dependency>
```

### D3. AgenticChangeAssistant service

New service in `backend-service`:
```java
@Service
public class AgenticChangeAssistant {
    // composeContext() — gather graph, ML, compliance context
    // generateECNDraft() — call Ollama with structured prompt
    // surfaceInWorklist() — create work item with pre-filled ECN
}
```

### D4. MinIO for document storage

Add MinIO container for ECN attachments and generated documents.

---

## Immediate Next Session

The highest-ROI item is **Phase A1: Frontend ImpactPreview wiring**. The backend now returns rich conflict and compliance data — the frontend should display it immediately. This is ~45 minutes and touches only 2 files.

After that, **Phase B: ML Service in Docker Compose** is 20 minutes and unblocks the full-stack test flow (`docker-compose up` should bring up all 5 services).

---

## Files Changed This Session

| File | Reason |
|------|--------|
| `ChangeRequestRepository.java` | Added `findActiveChangeRequests()` JPQL query |
| `AIImpactServiceImpl.java` | Conflict detection + compliance checking + new fields in builder |
| `AIImpactAnalysis.java` | Added `conflictingChangeNumbers`, `hasComplianceIssues`, `complianceWarnings` |
| `AIImpactServiceImplTest.java` | 8 new TDD tests across 4 nested groups |
| `GraphAnalysisService.java` | Injected ChangeRequestRepository, real conflict + compliance |
| `GraphAnalysisServiceTest.java` | Added `@Mock ChangeRequestRepository`, 4 new test cases |

**Next to wire:** `ImpactPreview.jsx` (frontend), `docker-compose.yml` (add ml-service)
