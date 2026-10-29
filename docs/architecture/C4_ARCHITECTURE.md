# Architecture Specification — C4 Model
## Application: Horus Flight Traffic Stand Allocation View
### Reference Standard: ARA-MAN-TIC-2008 (§3, pp. 21–22)

---

## 1. System Context Diagram (C4-1)
Describes how the Horus Stand Allocation application fits into the operational environment of Arajet and Punta Cana International Airport (PUJ).

```mermaid
graph TD
    User["Airport Dispatcher / Operations Control Center (OCC)"]
    Horus["Horus Stand Allocation System<br/>(Visual Timeline & Conflict Engine)"]
    Redash["PUJ Live Data Source<br/>(Redash Dashboard / API)"]
    Excel["Operational Resource Sheets<br/>(.xlsx Files)"]
    APIM["Arajet Azure API Management<br/>(APIM Gateway)"]

    User -->|"Monitors gates, resolves overlaps, reassigns stands"| Horus
    Horus -->|"Pulls periodic flight movements (every 5 min)"| Redash
    User -->|"Uploads daily resource allocation spreadsheets"| Horus
    Horus -->|"Exposes standard OpenAPI contracts"| APIM
```

---

## 2. Container Diagram (C4-2)
Describes the high-level technical building blocks, deployment units, and communication protocols.

```mermaid
graph TD
    Browser["Web Browser (Chrome / Edge)"]
    
    subgraph "Horus Frontend Container"
        Client["React 18 SPA (Vite + TypeScript)<br/>• Timeline Gantt Matrix<br/>• Real-time Conflict Banner<br/>• Stand Allocation Grid"]
    end

    subgraph "Horus Backend Container (AKS / App Service)"
        Server["Node.js / Express API (TypeScript)<br/>• Port: 4000<br/>• Probes: /api/health<br/>• Conflict Detection Engine<br/>• Redash Sync Worker"]
    end

    subgraph "Persistence & External Services"
        DB["Operational Storage<br/>(Azure SQL / Database State)"]
        ExternalRedash["PUJ Live Feed (Terminal B)"]
    end

    Browser -->|"HTTPS / WSS"| Client
    Client -->|"REST JSON (/api/flights, /api/stands, /api/sync)"| Server
    Server -->|"Reads / Writes Allocations"| DB
    Server -->|"HTTPS Polling (5m Interval)"| ExternalRedash
```

---

## 3. Component Diagram (C4-3)
Decomposes the Backend Container into its internal modules and adapters.

```mermaid
graph TD
    Router["Express Route Handlers<br/>(/api/flights, /api/stands, /api/sync, /api/upload)"]
    ConflictEngine["ConflictDetector Service<br/>(Evaluates Stand Overlaps & Timing)"]
    SyncWorker["RedashService<br/>(Data Ingestion, Filter Terminal B, Auto-Sync)"]
    ExcelParser["ExcelService<br/>(Spreadsheet Ingestion & Normalization)"]
    DBAdapter["StandDatabase Repository Adapter<br/>(Persistence Abstraction)"]

    Router -->|"Invokes evaluation"| ConflictEngine
    Router -->|"Triggers sync"| SyncWorker
    Router -->|"Parses sheets"| ExcelParser
    Router -->|"Queries & updates state"| DBAdapter
    SyncWorker -->|"Validates schedule before save"| ConflictEngine
    SyncWorker -->|"Persists sanitized flights"| DBAdapter
    ExcelParser -->|"Persists imported slots"| DBAdapter
```
