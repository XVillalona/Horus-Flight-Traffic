# ✈️ HORUS - Flight Traffic Stand Allocation System

Sistema integral para visualización, planificación y gestión gráfica de asignación de stands aeroportuarios en tiempo real, desarrollado bajo la arquitectura multi-agente **ODIN Zero-Overlap Framework**.

Inspirado en el visualizador operacional **Flight Traffic Stand Allocation View**.

---

## 🚀 Inicio Rápido (Un Solo Clic en Windows)

Simplemente haz doble clic sobre el archivo ejecutable en la raíz del proyecto:

```cmd
INICIAR_HORUS.bat
```

El script se encargará automáticamente de:
1. Verificar que **Node.js** esté instalado en tu sistema.
2. Instalar las dependencias de servidor y cliente si es la primera vez que se ejecuta.
3. Compilar la interfaz gráfica optimizada.
4. Iniciar el servidor local en `http://localhost:4000`.
5. Abrir automáticamente tu navegador web predeterminado.

---

## 🛩️ Cobertura de Stands y Puertas

El sistema está configurado con las posiciones operacionales críticas requeridas:

| Bloque | Rango de Posiciones | Características |
| :--- | :--- | :--- |
| **Buffer / Sin Asignar** | `Unassigned` | Fila superior (color ámbar) para retener vuelos en espera de asignación de rampa. |
| **Puertas Terminal B** | `B20` a `B37` | **División explícita de B23:** `B23A` y `B23B` con gestión independiente para vuelos narrowbody / regionales en paralelo. |
| **Puertas Terminal N** | `N6` a `N13` | Stands de rampa N con soporte para aeronaves narrowbody y widebody intercontinentales. |

---

## 🌟 Funcionalidades Clave

1. **Línea de Tiempo Interactiva (Timeline / Gantt):**
   - Escala horizontal de 24 horas con subdivisión de precisión a **5 minutos** (`00`, `05`, `10`, `15`, `20`, `25`, `30`, `35`, `40`, `45`, `50`, `55`).
   - **Scrubber amarillo en tiempo real:** Barra vertical amarilla que señala la hora actual con su etiqueta de hora en cabecera.
   - Bloques de vuelo con indicador visual dividido (Vuelo de Llegada en lateral izquierdo, Vuelo de Salida en lateral derecho, badge de aerolínea y franja de estado).

2. **Arrastre Interactivo (Drag & Drop):**
   - **Reasignación de Stand:** Arrastra cualquier vuelo verticalmente desde un stand hacia otro (por ejemplo, de `Unassigned` a `B23A` o de `B20` a `N6`).
   - **Ajuste Temporal (Time Shifting):** Al soltar el vuelo sobre la pista, se ajusta automáticamente la hora de llegada respetando la grilla de 5 minutos y manteniendo la duración del turnaround del avión.

3. **Detector Automático de Conflictos (Collision & Overlap Alert):**
   - Si dos vuelos coinciden en la misma posición y sus horarios se cruzan, el sistema:
     - Resalta inmediatamente los bloques afectados con borde y franja roja parpadeante (`flight-conflict-pulse`).
     - Activa el banner de alerta operacional en cabecera detallando los vuelos involucrados y la ventana horaria del solapamiento.
   - Los vuelos en la fila `Unassigned` no generan conflicto (funciona como área buffer).

4. **Carga Masiva Diaria y Semanal (Excel / CSV):**
   - Modal de subida con zona de arrastre (*drag & drop*).
   - Compatible con archivos `.xlsx`, `.xls` y `.csv`.
   - Modos de ingesta: **Actualizar / Añadir (Upsert)** o **Reemplazar Todo**.
   - Descarga directa de la plantilla Excel oficial (`Horus_Plantilla_Asignacion_Stands.xlsx`).

5. **Edición Manual Rápida:**
   - Haz clic en cualquier vuelo para abrir el formulario modal.
   - Modifica vuelos de llegada/salida, aerolínea, tipo de aeronave (A320, B787, A350, etc.), matrícula, origen, destino, horas STA/STD y observaciones de rampa.

---

## 🏛️ Arquitectura del Sistema Multi-Agente (.agents/)

El sistema fue diseñado y orquestado bajo la supervisión de **ODIN** con política de cero solapamiento:
- **`00_odin_orchestrator.md`**: Gobernanza, Data Contracts y supervisión.
- **`01_ux_ui_architect.md`**: Sistema de diseño, tokens de tiempo y colores de consola de despacho.
- **`02_frontend_specialist.md`**: React 18, Vite, Tailwind CSS y motor de drag & drop en timeline.
- **`03_backend_architect.md`**: Express REST API, algoritmos de detección de colisiones e ingesta SheetJS.
- **`04_data_db_engineer.md`**: Esquemas de datos, persistencia JSON atómica y catálogo de stands.
- **`05_qa_sec_auditor.md`**: Suites de pruebas y verificación de límites operacionales.
- **`SHARED_PROTOCOL.md`**: Contrato de comunicación y regla de no-intrusión.
- **`TASK_BOARD.md`**: Tablero de seguimiento y estado en tiempo real.
