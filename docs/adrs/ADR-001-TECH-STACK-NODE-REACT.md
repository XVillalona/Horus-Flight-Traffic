# ADR-001: Technology Stack Selection for Horus Stand Allocation
## Status: Accepted / Documented for Enterprise Applications Review
### Date: 2026-10-28
### Author: Horus Engineering Team
### Reference: ARA-MAN-TIC-2008 (§2.3, §8)

---

## 1. Context and Problem Statement
Arajet standardizes primary backend services on **.NET (ASP.NET Core)** and **Python (FastAPI)**, and frontends on **Next.js + React + SASS** (Interdimensional Flight Kit).
The Horus Flight Traffic Stand Allocation View was engineered as a high-density, real-time airport operational visualizer requiring low latency timeline rendering, drag-and-drop stand reassignments, spreadsheet ingestion, and real-time polling synchronization with airport ground dashboards.

## 2. Decision
1. **Frontend:** React 18 + Vite + TypeScript. Provides instant rendering for 50+ simultaneous flight tracks and interactive conflict re-computations without page overhead.
2. **Backend:** Node.js + Express (TypeScript). Implements lightweight, non-blocking asynchronous event handling for periodic Redash sync, Excel buffer processing, and JSON API dispatch.
3. **Containerization & Deployment Baseline:** The application is packaged in a non-root standard Docker container deployed onto **Azure Kubernetes Service (AKS)**, behind **Azure API Management (APIM)**, exposing standard health check endpoints (`/api/health`) and OpenAPI 3.0 contracts (`api-spec/openapi.json`).
4. **Configuration & Secrets:** All connection parameters and credentials resolve exclusively from environment variables populated via **Azure App Configuration** and **Azure Key Vault**. Zero hardcoded secrets are permitted.

## 3. Consequences and Alignment Plan
* **Positive:**
  - High performance and immediate operational responsiveness in control room environments.
  - Zero disruption to existing airport flight traffic visualization.
* **Compliance Actions for Arajet Alignment:**
  - Expose OpenAPI 3.0 contracts to APIM.
  - Align visual themes with the Arajet Design System / Interdimensional Flight Kit tokens (colors, typography).
  - Enforce unit test coverage ≥ 80% with Given-When-Then test structure.
  - Integrate with Azure Log Analytics Workspace via structured JSON logs.
