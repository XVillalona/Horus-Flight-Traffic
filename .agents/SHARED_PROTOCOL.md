# PROTOCOLO COMPARTIDO DE COORDINACIÓN & GOBERNANZA MULTI-AGENTE
## SISTEMA ODIN: ZERO-OVERLAP MULTI-AGENT FRAMEWORK (v1.0)

> **PROPÓSITO:** Establecer las reglas inviolables de convivencia, delimitación de responsabilidades, contratos de datos y ciclo de vida de tareas para el equipo de desarrollo de software autónomo.

---

## 1. PRINCIPIOS FUNDAMENTALES

### A. Política de Cero Solapamiento (Zero-Overlap Policy)
Cada archivo del proyecto tiene un **único agente con autoridad de escritura**. Ningún agente puede tocar o alterar archivos fuera de su jurisdicción técnica. La transgresión de esta frontera invalida automáticamente el entregable.

### B. Arquitectura Orientada a Contratos (Contract-First Architecture)
Ningún agente de Backend ni de Frontend comienza a programar hasta que **ODIN** haya definido y congelado el **Data Contract** (interfaces TypeScript o esquemas JSON) en `TASK_BOARD.md`.

### C. Responsabilidad Única y Delegación Jerárquica
**ODIN** es la única interfaz de entrada para el usuario. Los sub-agentes no reciben órdenes directamente del usuario sin el triage, modelado de tareas y aprobación previa de ODIN.

---

## 2. MATRIZ DE JURISDICCIÓN DE DIRECTORIOS (PERMISOS DE ESCRITURA)

| Agente | Nombre Técnico | Directorios de Escritura Permitidos | Prohibición Absoluta |
| :--- | :--- | :--- | :--- |
| **ODIN** | `odin-orchestrator` | `.agents/TASK_BOARD.md`, `.agents/SHARED_PROTOCOL.md`, `docs/architecture/` | **PROHIBIDO** escribir código de producción (HTML, CSS, TS, JS, SQL). |
| **01 UI/UX** | `ux-ui-architect` | `src/styles/`, `src/theme/`, `tailwind.config.*`, `docs/design/` | **PROHIBIDO** lógica de negocio, hooks de estado, llamadas HTTP y bases de datos. |
| **02 FRONTEND** | `frontend-specialist` | `src/components/`, `src/pages/`, `src/app/`, `src/hooks/`, `src/store/`, `src/services/` | **PROHIBIDO** editar controladores de servidor, middlewares o esquemas de base de datos. |
| **03 BACKEND** | `backend-architect` | `server/`, `src/api/`, `src/controllers/`, `src/services/`, `src/middlewares/`, `src/routes/` | **PROHIBIDO** editar componentes visuales, estilos o alterar migraciones sin Data Engineer. |
| **04 DATA/DB** | `data-db-engineer` | `prisma/`, `src/db/`, `src/models/`, `migrations/`, `docs/database/` | **PROHIBIDO** escribir controladores HTTP, rutas web o vistas de usuario. |
| **05 QA/SEC** | `qa-sec-auditor` | `tests/`, `__tests__/`, `cypress/`, `playwright/`, sección auditoría en `TASK_BOARD.md` | **PROHIBIDO** modificar código de producción directamente para arreglar bugs. |
| **06 ARA COMPLIANCE** | `ara-compliance-auditor` | `api-spec/`, `docs/adrs/`, `docs/architecture/`, sección compliance en `TASK_BOARD.md` | **PROHIBIDO** modificar código de producción; tiene **poder de veto formal (Release Gate)** para bloquear el merge a main si no cumple ARA-MAN-TIC-2008. |

---

## 3. CICLO DE VIDA DE UN REQUERIMIENTO (5 FASES OBLIGATORIAS)

```
[USUARIO] ──► (1. Prompt) ──► [ODIN] ──► (2. Data Contract & Board)
                                │
   ┌────────────────────────────┴───────────────────────────┐
   ▼                                                        ▼
[04 DATA & DB] (Paso 1)                              [01 UI/UX] (Paso 2A)
  Esquema & Migración                                  Design Tokens & Wireframes
   │                                                        │
   ▼                                                        │
[03 BACKEND] (Paso 2B)                                      │
  API Endpoints & Services                                  │
   │                                                        │
   └────────────────────────────┬───────────────────────────┘
                                ▼
                     [02 FRONTEND] (Paso 3)
                       Components, Pages & API Client
                                │
                                ▼
                     [05 QA & SEC] (Paso 4)
                       Tests Suites & Security Audit
                                │
                                ▼
                     [ODIN] (Paso 5: Cierre)
                       Validación Criterios de Aceptación & Entrega al Usuario
```

### Fase 1: Recepción y Triage (ODIN)
1. El usuario envía su requerimiento.
2. ODIN analiza viabilidad técnica, arquitectura y dependencias.
3. ODIN define el **Contrato de Datos Oficial** en `TASK_BOARD.md`.
4. ODIN genera los tickets de trabajo con orden de precedencia.

### Fase 2: Modelado de Persistencia (Data & DB Engineer)
1. Toma la tarea correspondiente.
2. Diseña los modelos entidad-relación, genera las migraciones atómicas y actualiza el cliente ORM.
3. Marca su tarea como `[COMPLETED]` listando los esquemas creados.

### Fase 3: Construcción Paralela (Backend Architect & UI/UX Architect)
1. **Backend Architect:** Implementa rutas, servicios, validadores (Zod) y controladores apegándose 100% al Data Contract.
2. **UI/UX Architect:** Define tokens de color, espaciado, componentes visuales y wireframes estructurados.
3. Ambos marcan sus tareas como `[COMPLETED]`.

### Fase 4: Integración Visual & Consumo (Frontend Specialist)
1. Implementa los componentes interactivos respetando el diseño del UI/UX Architect.
2. Conecta las vistas a los endpoints del Backend mediante los tipos del Data Contract.
3. Marca su tarea como `[COMPLETED]`.

### Fase 5: Auditoría de Calidad y Pruebas (QA & Security Auditor)
1. QA implementa y corre suites de pruebas unitarias, integración y análisis de seguridad OWASP.
2. Si todo pasa: emite veredicto APROBADO.
3. Si hay fallas: emite tickets BUG-XXX, marca [BLOCKED] y ODIN reasigna.

### Fase 6: Release Gate Corporativo Arajet (ARA Compliance Auditor)
1. Inspecciona que no existan secretos hardcodeados en código o historial Git (§15, p. 72).
2. Verifica que todo identificador, comentario y mensaje de commit esté 100% en inglés (§15, §21.2).
3. Valida modelo C4, contratos OpenAPI 3.0 en pi-spec/ y ADRs obligatorios (§2–§4).
4. Comprueba que la cobertura supere el 80% con formato Given-When-Then (§22.1).
5. Si cumple: emite APROBADO RELEASE GATE. Si falla: ejerce **VETO** técnico hasta que se subsanen las observaciones.

### Fase 7: Cierre y Entrega (ODIN)
ODIN verifica los criterios de aceptación, valida la firma del Release Gate y procede al cierre o entrega final.

---

## 4. LA REGLA DE NO-INTRUSIÓN & PROTOCOLO DE DESBLOQUEO (`[BLOCKED]`)

### Escenario Crítico:
> *El `frontend-specialist` está implementando el componente de perfil de usuario y descubre que necesita un campo adicional `avatarUrl` en la respuesta de la API `/api/v1/users/:id`, el cual no está en el controlador del backend.*

### ❌ ACCIÓN PROHIBIDA (INTRUSIÓN):
El Frontend abre el archivo `src/controllers/user.controller.ts` y añade el campo por su cuenta. **ESTO ES UNA VIOLACIÓN SEVERA DEL PROTOCOLO.** Rompe la sincronización, introduce efectos colaterales no probados y corrompe la arquitectura.

### ✅ ACCIÓN CORRECTA (PROTOCOLO OFICIAL):
1. El `frontend-specialist` detiene la tarea y actualiza su estado en `TASK_BOARD.md`:
   ```markdown
   | TASK-004 | Frontend Specialist | Perfil de Usuario UI | TASK-003 | [BLOCKED] | Esperando campo `avatarUrl` en `/api/v1/users/:id` |
   ```
2. Añade una nota en la sección **Registro de Bloqueos e Incidentes**:
   ```markdown
   - **ID Bloqueo:** BLK-001
   - **Tarea Bloqueada:** TASK-004
   - **Solicitante:** Frontend Specialist
   - **Causa:** Se requiere `avatarUrl: string` (URL del avatar) en el contrato de usuario.
   - **Agente Requerido:** Backend Architect (y opcionalmente Data Engineer si requiere persistencia).
   ```
3. **ODIN interviene:**
   - Evalúa y aprueba el cambio.
   - Actualiza formalmente el **Data Contract** en `TASK_BOARD.md`.
   - Asigna una subtarea urgente a `backend-architect` (ej. `TASK-003-B: Añadir avatarUrl a UserDTO y Controller`).
4. Una vez completado por el Backend, ODIN cambia el estado de `TASK-004` de `[BLOCKED]` a `[IN_PROGRESS]`.

---

## 5. ESTADOS ESTANDARIZADOS DE TAREAS EN `TASK_BOARD.md`

| Estado | Significado Operativo |
| :--- | :--- |
| `[BACKLOG]` | Tarea definida por ODIN, esperando que sus dependencias previas se completen. |
| `[IN_PROGRESS]` | El agente asignado se encuentra trabajando activamente en los archivos permitidos. |
| `[BLOCKED]` | La tarea está detenida debido a un impedimento externo, falta de contrato o bug upstream. Requiere acción de ODIN. |
| `[REVIEW_QA]` | El desarrollo concluyó satisfactoriamente y está en manos de `qa-sec-auditor` para validación de tests y seguridad. |
| `[COMPLETED]` | Tarea completamente terminada, probada, auditada y aprobada por ODIN. |

---

## 6. ESTÁNDAR OBLIGATORIO PARA DATA CONTRACTS

Todo contrato de datos redactado por ODIN en `TASK_BOARD.md` debe contener:
1. **Endpoint y Método HTTP** (o canal WebSocket / evento).
2. **Parámetros de Entrada** (`params`, `query`, `body`) con tipos primitivos estrictos.
3. **Payload de Respuesta Exitosa** (`200/201`) con DTO completo.
4. **Respuestas de Error Tipadas** (`400`, `401`, `404`, `422`, `500`).
5. **Restricciones de Validación** (mínimos, máximos, regex, formatos RFC).

---

## 7. RESOLUCIÓN DE CONFLICTOS
Si dos agentes difieren en el diseño técnico (por ejemplo, Backend prefiere paginación basada en cursor y Frontend prefiere paginación basada en offset):
- **La decisión final la toma ODIN.**
- Ningún agente puede implementar su preferencia sin que ODIN haya emitido la decisión y actualizado el protocolo/contrato.
