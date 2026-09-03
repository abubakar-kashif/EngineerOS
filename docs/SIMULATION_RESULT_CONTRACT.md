# EngineerOS — Simulation Result Contract

**Version:** 1.0.0  
**Status:** FROZEN  
**Date:** 2026-08-30  
**Owner:** Person 1 — Simulation Engine

---

## 1. Purpose

This document defines the **contract** between the Simulation Engine (Person 1) and all consumers of simulation results:

- Person 2 — Simulation Integration (backend persistence, API)
- AI Team — Simulation context for explanations
- Frontend — Display of simulation results
- Reports — Simulation data for reports

**Once frozen, all consumers must use this contract.**

Do not guess field names. Do not invent new fields without updating this contract.

---

## 2. Core Types

### 2.1 SimulationStatus

```typescript
type SimulationStatus = 
  | 'idle'       // No simulation executed
  | 'ready'      // Circuit structurally ready to run
  | 'running'    // Solver is executing
  | 'completed'  // Valid results produced
  | 'invalid'    // Circuit failed validation
  | 'failed';    // Validation passed but execution failed
2.2 SimulationResult
typescript
interface SimulationResult {
  status: SimulationStatus;
  validation?: ValidationResult;
  dcResult?: DCResult;
  measurements?: Measurements;
  graphs?: GraphData[];
  error?: string;
  metadata?: SimulationMetadata;
}
2.3 ValidationResult
typescript
interface ValidationResult {
  valid: boolean;
  errors: SimulationError[];
  warnings: SimulationError[];
}
2.4 SimulationError
typescript
interface SimulationError {
  code: ErrorCode;
  severity: 'error' | 'warning' | 'info';
  message: string;
  explanation?: string;
  affectedComponents?: string[];
  affectedTerminals?: string[];
  suggestedFix?: string;
}
2.5 ErrorCode
typescript
type ErrorCode =
  | 'MISSING_GROUND'
  | 'OPEN_CIRCUIT'
  | 'FLOATING_NODE'
  | 'DANGLING_TERMINAL'
  | 'DANGLING_WIRE'
  | 'INVALID_CONNECTION'
  | 'INVALID_COMPONENT_VALUE'
  | 'SHORT_CIRCUIT'
  | 'INVALID_SOURCE_CONFIGURATION'
  | 'LED_NO_CURRENT_LIMIT'
  | 'DIODE_REVERSE_BIASED'
  | 'SOLVER_FAILED'
  | 'UNSUPPORTED_COMPONENT'
  | 'INVALID_COMPONENT_ID'
  | 'INVALID_TERMINAL_ID'
  | 'DUPLICATE_CONNECTION';
3. DC Solver Results
3.1 DCResult
typescript
interface DCResult {
  nodeVoltages: Map<string, number>;  // nodeId -> voltage (V)
  branchCurrents: Map<string, number>; // connectionId -> current (A)
  componentResults: Map<string, ComponentResult>;
  totalCurrent: number;  // A
  totalPower: number;    // W
  equivalentResistance: number;  // Ω
  success: boolean;
  error?: string;
}
3.2 ComponentResult
typescript
interface ComponentResult {
  componentId: string;
  voltage: number;   // V (voltage across component)
  current: number;   // A (current through component)
  power: number;     // W
  resistance?: number; // Ω (for resistors)
}
4. Measurements
4.1 Measurements
typescript
interface Measurements {
  totalVoltage: number;
  totalCurrent: number;
  totalPower: number;
  equivalentResistance: number;
  componentMeasurements: ComponentMeasurement[];
}
4.2 ComponentMeasurement
typescript
interface ComponentMeasurement {
  componentId: string;
  type: string;
  voltage: number;
  current: number;
  power: number;
  resistance?: number;
}
4.3 Measurement (Detailed)
typescript
interface Measurement {
  id: string;
  type: 'voltage' | 'current' | 'power' | 'resistance' | 'energy';
  value: number;
  unit: string;
  label: string;
  componentId?: string;
  terminalIds?: string[];
  nodeId?: string;
}
4.4 CompleteMeasurements
typescript
interface CompleteMeasurements {
  source: MeasurementGroup;
  components: MeasurementGroup;
  nodes: MeasurementGroup;
  totals: MeasurementGroup;
  summary: MeasurementGroup;
}

interface MeasurementGroup {
  name: string;
  measurements: Measurement[];
}
5. Graph Data
5.1 GraphData
typescript
interface GraphData {
  id: string;
  type: 'line' | 'scatter' | 'bar';
  title: string;
  xAxis: {
    label: string;
    unit: string;
  };
  yAxis: {
    label: string;
    unit: string;
  };
  series: GraphSeries[];
  metadata?: Record<string, any>;
}
5.2 GraphSeries
typescript
interface GraphSeries {
  name: string;
  points: GraphPoint[];
  color?: string;
}
5.3 GraphPoint
typescript
interface GraphPoint {
  x: number;
  y: number;
}
5.4 Available Graph Types
Graph ID	Description	Conditions
ohms_law	Voltage vs Current	Requires voltage source + resistor
voltage_divider	Input vs Output Voltage	Requires 2+ resistors
rc_charging	Time vs Capacitor Voltage	Requires capacitor + resistor
rl_charging	Time vs Inductor Current	Requires inductor + resistor
power_graph	Power vs Resistance	Requires voltage source + resistor
component_analysis	Component Power Analysis	Requires passive components
iv_{componentId}	Current vs Voltage	For resistor, diode, LED
6. Circuit Definition
6.1 CircuitDefinition
typescript
interface CircuitDefinition {
  id?: string;
  name?: string;
  experimentId?: string;
  components: Component[];
  connections: Connection[];
  nodes?: ElectricalNode[];
}
6.2 Component
typescript
interface Component {
  id: string;
  type: ComponentType;
  label: string;
  position: Position;
  rotation: number;  // degrees
  properties: ComponentProperties;
  terminals: Terminal[];
  metadata?: Record<string, any>;
}
6.3 ComponentType
typescript
type ComponentType =
  | 'voltage_source'
  | 'current_source'
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'diode'
  | 'led'
  | 'switch'
  | 'ground'
  | 'voltmeter'
  | 'ammeter';
6.4 ComponentProperties
typescript
interface ComponentProperties {
  resistance?: number;      // Ω
  voltage?: number;         // V
  current?: number;         // A
  capacitance?: number;     // F
  inductance?: number;      // H
  forwardVoltage?: number;  // V
  state?: 'open' | 'closed';
  [key: string]: any;
}
6.5 Terminal
typescript
interface Terminal {
  id: string;
  type: TerminalType;
  componentId: string;
  label?: string;
}
6.6 TerminalType
typescript
type TerminalType =
  | 'A'
  | 'B'
  | 'positive'
  | 'negative'
  | 'anode'
  | 'cathode'
  | 'ground'
  | 'input'
  | 'output';
6.7 Connection
typescript
interface Connection {
  id: string;
  from: string;  // terminal ID
  to: string;    // terminal ID
}
6.8 Position
typescript
interface Position {
  x: number;
  y: number;
}
7. Component Terminal Mapping
Component Type	Terminals
resistor	A, B
capacitor	A, B
inductor	A, B
diode	anode, cathode
led	anode, cathode
switch	A, B
voltage_source	positive, negative
current_source	positive, negative
ground	ground
voltmeter	positive, negative
ammeter	input, output
8. Unit Normalization
All values stored internally in SI base units:

Quantity	Unit	Symbol
Voltage	Volt	V
Current	Ampere	A
Resistance	Ohm	Ω
Capacitance	Farad	F
Inductance	Henry	H
Power	Watt	W
Time	Second	s
Frontend may display formatted values (mV, mA, kΩ, µF, mH, mW).

9. Numerical Tolerance
typescript
const NUMERICAL_TOLERANCE = {
  absolute: 1e-9,
  relative: 1e-6,
};
Do not test floating-point values with exact equality.

10. Serialization
Circuit definitions must be serializable to JSON.

Supported fields for serialization:

typescript
interface SerializableCircuit {
  id?: string;
  name?: string;
  experimentId?: string;
  components: SerializableComponent[];
  connections: SerializableConnection[];
}

interface SerializableComponent {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  rotation: number;
  properties: Record<string, any>;
  terminals: { id: string; type: string; componentId: string; label?: string }[];
  metadata?: Record<string, any>;
}

interface SerializableConnection {
  id: string;
  from: string;
  to: string;
}
11. Example: Successful Simulation
json
{
  "status": "completed",
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "dcResult": {
    "nodeVoltages": {
      "N1": 5,
      "N2": 0
    },
    "branchCurrents": {
      "W1": 0.005
    },
    "componentResults": {
      "R1": {
        "componentId": "R1",
        "voltage": 5,
        "current": 0.005,
        "power": 0.025,
        "resistance": 1000
      }
    },
    "totalCurrent": 0.005,
    "totalPower": 0.025,
    "equivalentResistance": 1000,
    "success": true
  },
  "measurements": {
    "totalVoltage": 5,
    "totalCurrent": 0.005,
    "totalPower": 0.025,
    "equivalentResistance": 1000,
    "componentMeasurements": [
      {
        "componentId": "R1",
        "type": "resistor",
        "voltage": 5,
        "current": 0.005,
        "power": 0.025,
        "resistance": 1000
      }
    ]
  },
  "graphs": [
    {
      "id": "ohms_law",
      "type": "line",
      "title": "Ohm's Law: Voltage vs Current",
      "xAxis": { "label": "Voltage", "unit": "V" },
      "yAxis": { "label": "Current", "unit": "A" },
      "series": [
        {
          "name": "R = 1000Ω",
          "points": [
            { "x": 0, "y": 0 },
            { "x": 1, "y": 0.001 },
            { "x": 2, "y": 0.002 },
            { "x": 3, "y": 0.003 },
            { "x": 4, "y": 0.004 },
            { "x": 5, "y": 0.005 }
          ],
          "color": "#3b82f6"
        }
      ],
      "metadata": {
        "resistance": 1000,
        "maxVoltage": 5,
        "numPoints": 10
      }
    }
  ],
  "metadata": {
    "simulationTime": "2026-08-30T10:00:00Z",
    "solverVersion": "1.0.0"
  }
}
12. Example: Invalid Circuit
json
{
  "status": "invalid",
  "validation": {
    "valid": false,
    "errors": [
      {
        "code": "MISSING_GROUND",
        "severity": "error",
        "message": "The circuit has no ground reference.",
        "explanation": "A ground is required to define a reference voltage point.",
        "suggestedFix": "Add a ground component and connect it to the circuit."
      }
    ],
    "warnings": []
  },
  "error": "Circuit validation failed"
}
13. Example: LED Error
json
{
  "status": "invalid",
  "validation": {
    "valid": false,
    "errors": [
      {
        "code": "LED_NO_CURRENT_LIMIT",
        "severity": "error",
        "message": "LED connected without current-limiting resistor.",
        "explanation": "The LED is connected directly to the source.",
        "affectedComponents": ["LED1"],
        "affectedTerminals": ["LED1.anode", "LED1.cathode"],
        "suggestedFix": "Add a current-limiting resistor in series with the LED."
      }
    ],
    "warnings": []
  },
  "error": "Circuit validation failed"
}
14. Consumer Responsibilities
Person 2 — Simulation Integration
Store CircuitDefinition in database

Persist SimulationResult with all fields

Expose API endpoints returning SimulationResult

Do not modify calculation fields

AI Team
Consume SimulationResult for context

Use ValidationResult for explanations

Use Measurements for analysis

Use GraphData for visual explanations

Do not simulate or calculate independently

Frontend
Display SimulationResult status

Render Measurements in UI

Render GraphData using chart library

Show ValidationResult errors with suggestions

Reports
Use Measurements for report data

Use GraphData for report charts

Use ComponentMeasurement for component analysis

15. Version History
Version	Date	Changes
1.0.0	2026-08-30	Initial frozen contract
16. Change Process
To change this contract:

Person 1 must propose the change

All consumers (Person 2, AI, Frontend, Reports) must review

Update version number

Update this document

Notify all consumers

Do not make breaking changes without coordination.

