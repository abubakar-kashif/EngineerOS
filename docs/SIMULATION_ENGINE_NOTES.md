# EngineerOS — Simulation Engine Notes

**Version:** 1.0.0  
**Date:** 2026-08-30  
**Owner:** Person 1 — Simulation Engine

---

## 1. Overview

EngineerOS Simulation Engine is a **DC circuit simulator** designed for electrical engineering education.

It provides:
- Circuit definition and modeling
- Structural and electrical validation
- DC solver (Ohm's Law, KCL, KVL)
- Component models (resistor, capacitor, inductor, diode, LED)
- Measurements generation
- Graph data generation

---

## 2. Architecture
Circuit UI
↓
CircuitDefinition
↓
CircuitGraphBuilder (Phase A3)
↓
CircuitValidator (Phase A4)
↓
DCSolver (Phase A5)
↓
Measurements (Phase A7)
↓
GraphData (Phase A8)
↓
SimulationResult (Phase A9)
↓
Persistence (Person 2)

text

---

## 3. Phase Summary

| Phase | Name | Files | Status |
|-------|------|-------|--------|
| A1 | Audit | - | ✅ Complete |
| A2 | Circuit Types | `units.ts`, `errors.ts`, `circuitGraph.ts`, `index.ts` | ✅ Complete |
| A3 | Graph Builder | `circuitGraphBuilder.ts`, `__tests__/circuitGraphBuilder.test.ts` | ✅ Complete |
| A4 | Validator | `circuitValidator.ts`, `__tests__/circuitValidator.test.ts` | ✅ Complete |
| A5 | DC Solver | `dcSolver.ts`, `circuitSolver.ts`, `types.ts`, `__tests__/` | ✅ Complete |
| A6 | Component Models | `resistorAnalysis.ts`, `capacitorAnalysis.ts`, `inductorAnalysis.ts`, `diodeAnalysis.ts`, `componentModels.ts`, `__tests__/componentModels.test.ts` | ✅ Complete |
| A7 | Measurements | `measurements.ts`, `__tests__/measurements.test.ts` | ✅ Complete |
| A8 | Graph Data | `graphData.ts`, `__tests__/graphData.test.ts` | ✅ Complete |
| A9 | Freeze Contract | `SIMULATION_RESULT_CONTRACT.md`, `SIMULATION_ENGINE_NOTES.md` | ✅ Complete |

---

## 4. File Structure
frontend/src/components/simulation/engine/
│
├── units.ts # SI unit normalization
├── errors.ts # Error codes and structures
├── circuitGraph.ts # Core circuit definitions
├── circuitGraphBuilder.ts # Electrical node generation
├── circuitValidator.ts # Circuit validation
├── dcSolver.ts # DC solver implementation
├── circuitSolver.ts # Main solver interface
├── types.ts # Shared types
├── resistorAnalysis.ts # Resistor calculations
├── capacitorAnalysis.ts # Capacitor calculations
├── inductorAnalysis.ts # Inductor calculations
├── diodeAnalysis.ts # Diode and LED calculations
├── componentModels.ts # Component model aggregator
├── measurements.ts # Measurements generation
├── graphData.ts # Graph data generation
├── index.ts # Public API exports
│
└── tests/
├── circuitGraphBuilder.test.ts
├── circuitValidator.test.ts
├── dcSolver.test.ts
├── circuitSolver.test.ts
├── componentModels.test.ts
├── measurements.test.ts
└── graphData.test.ts

text

---

## 5. Key Design Decisions

### 5.1 UI Independence
- Solver does not use screen positions
- Positions are only for the editor
- Electrical truth comes from terminal connections

### 5.2 SI Base Units
- All values stored internally in SI base units
- Frontend formats for display (mV, mA, kΩ, etc.)

### 5.3 No Fake Data
- Never generate fake simulation results
- Use real `loading`, `success`, `empty`, `error` states
- Do not use sample data as fallback

### 5.4 Node-Based Solving
- Prefer node-based analysis over manual series/parallel detection
- Circuit graph determines topology
- Solver works on electrical nodes

---

## 6. Supported Components

### Sources
- DC voltage source
- Current source

### Passive
- Resistor
- Capacitor (DC steady state)
- Inductor (DC steady state)

### Semiconductor
- Diode (simplified model)
- LED (with current limiting requirement)

### Control
- Switch (open/closed)

### Reference
- Ground

### Measurement
- Voltmeter
- Ammeter

---

## 7. Solver Capabilities

### Supported Calculations
- Ohm's Law
- Series circuits
- Parallel circuits
- Mixed resistor networks
- Node voltage analysis
- Branch current analysis
- Power calculations

### Validation
- Structural validation (component IDs, terminals, connections)
- Electrical validation (ground, short circuit, LED current limit)
- Error codes with explanations and suggested fixes

### Measurements
- Source voltage, current, power
- Component voltage, current, power
- Node voltages
- Total current, power, resistance

### Graphs
- Ohm's Law: Voltage vs Current
- Voltage Divider: Input vs Output
- RC Circuit: Time vs Capacitor Voltage
- RL Circuit: Time vs Inductor Current
- Power vs Resistance
- Component Analysis
- I-V curves

---

## 8. Testing

### Test Coverage
- Unit tests for all calculations
- Solver tests for Ohm's Law, series, parallel
- Validator tests for all error codes
- Graph data validation tests

### Test Naming Convention
- Files: `*.test.ts`
- Folder: `__tests__/`

### Numerical Tolerance
```typescript
absolute: 1e-9
relative: 1e-6
9. Future Enhancements
Phase 2 (Future)
AC analysis

Transient analysis

Transistor models

MOSFET models

Op-amp models

Motor models

Relay models

Logic gates

Phase 3 (Future)
SPICE-like simulation

Full transient solver

Frequency domain analysis

Bode plots

Nyquist plots

10. Known Limitations
DC only: No AC or transient analysis

Simplified diode model: No full semiconductor physics

Capacitor/Inductor: DC steady state only

No temperature effects: Components are ideal

No tolerance analysis: Values are exact

No parameter sweeps: Fixed values only (except graph generation)

11. Integration Points
Person 2 — Simulation Integration
Consumes: CircuitDefinition, SimulationResult

Provides: Persistence, API, save/load

Contract: SIMULATION_RESULT_CONTRACT.md

AI Team
Consumes: SimulationResult, ValidationResult

Provides: Explanations, context

Contract: SIMULATION_RESULT_CONTRACT.md

Frontend
Consumes: SimulationResult, Measurements, GraphData

Provides: UI rendering

Contract: SIMULATION_RESULT_CONTRACT.md

12. Performance Considerations
Do not solve during drag operations

Solve only on explicit Run action

Lightweight validation can run continuously

Graph generation should be efficient

13. Error Handling Philosophy
Scenario	Action
Validation fails	Return invalid status with errors
Solver fails	Return failed status with error message
Invalid input	Return structured error with suggestion
Missing values	Return structured error
Unexpected error	Return failed status, don't crash
14. Git Workflow
Branch
text
simulation/engine-core
Commit Messages
text
feat(simulation): implement circuit graph
feat(simulation): implement circuit validator
feat(simulation): implement dc solver
test(simulation): add solver tests
docs(simulation): freeze result contract
15. Definition of Done — Person 1
☑ CircuitDefinition works
☑ Component model works
☑ Terminal model works
☑ Connection model works
☑ Electrical nodes work
☑ Validator works
☑ Error codes work
☑ DC solver works
☑ Series works
☑ Parallel works
☑ Mixed networks work
☑ KCL/KVL verified
☑ Voltage calculated
☑ Current calculated
☑ Power calculated
☑ Capacitor model works
☑ Inductor model works
☑ Diode model works
☑ LED model works
☑ Measurements work
☑ Graph data works
☑ Tests pass
☑ Simulation contract published