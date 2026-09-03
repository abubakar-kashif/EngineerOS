// backend/engine_runner/runner.ts
import * as engine from '../../frontend/src/components/simulation/engine/index';
import { createTerminalId } from '../../frontend/src/components/simulation/engine/circuitGraph';
import * as crypto from 'crypto';

// ---- Serialization helper (converts Maps to objects) ----
function serializeResult(result: any): any {
    if (result && typeof result === 'object') {
        if (result instanceof Map) {
            return Object.fromEntries(result);
        }
        if (Array.isArray(result)) {
            return result.map(serializeResult);
        }
        const newObj: any = {};
        for (const [key, value] of Object.entries(result)) {
            newObj[key] = serializeResult(value);
        }
        return newObj;
    }
    return result;
}

// ---- Read stdin ----
let data = '';
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
    try {
        const input = JSON.parse(data);
        let circuitDef = input.circuitDefinition;

        // Convert to engine format
        circuitDef = convertToEngineFormat(circuitDef);

        // Validate
        const validation = engine.validateCircuit(circuitDef);
        if (!validation.valid) {
            const result = {
                status: 'invalid',
                validation: validation,
                error: 'Circuit validation failed'
            };
            console.log(JSON.stringify(serializeResult(result)));
            return;
        }

        // Solve
        const solution = engine.solveCircuit(circuitDef);
        const serialized = serializeResult(solution);
        console.log(JSON.stringify(serialized));
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});

// ---- Robust conversion with deterministic IDs ----
function convertToEngineFormat(circuit: any): any {
    // Ensure circuit object exists
    if (!circuit || typeof circuit !== 'object') {
        throw new Error('Invalid circuit definition: expected an object');
    }

    // Safely get components and connections, default to empty arrays
    const components = Array.isArray(circuit.components) ? circuit.components : [];
    const connections = Array.isArray(circuit.connections) ? circuit.connections : [];

    // Convert components: terminal strings → terminal objects
    const convertedComponents = components.map((comp: any) => {
        // Basic component validation
        if (!comp.id) {
            throw new Error('Component missing "id" field');
        }
        const terminals = comp.terminals || [];
        let terminalObjects: any[] = [];
        if (Array.isArray(terminals) && terminals.length > 0 && typeof terminals[0] === 'string') {
            terminalObjects = terminals.map((t: string) => ({
                id: createTerminalId(comp.id, t),
                type: t,
                componentId: comp.id
            }));
        } else if (Array.isArray(terminals) && terminals.length > 0 && typeof terminals[0] === 'object') {
            // Already terminal objects – ensure they have required fields
            terminalObjects = terminals.map((t: any) => ({
                id: t.id || createTerminalId(comp.id, t.type || 'unknown'),
                type: t.type || 'unknown',
                componentId: comp.id,
                ...t
            }));
        }
        // Position defaults
        const position = comp.position && typeof comp.position === 'object'
            ? { x: comp.position.x ?? 0, y: comp.position.y ?? 0 }
            : { x: 0, y: 0 };

        return {
            ...comp,
            terminals: terminalObjects,
            position,
            // Ensure other optional fields exist (e.g., value, resistance, etc.)
            value: comp.value ?? null,
            resistance: comp.resistance ?? null,
            voltage: comp.voltage ?? null,
            current: comp.current ?? null,
        };
    });

    // Convert connections: deterministic IDs, replace ':' with '.'
    const convertedConnections = connections.map((conn: any, index: number) => {
        // Validate required fields
        if (!conn.from || !conn.to) {
            throw new Error(`Connection at index ${index} missing "from" or "to" field`);
        }

        // Generate deterministic ID from from+to using SHA256 (truncated for readability)
        const hash = crypto.createHash('sha256')
            .update(`${conn.from}|${conn.to}`)
            .digest('hex')
            .substring(0, 12);
        const id = conn.id || `conn_${hash}`;

        // Replace ':' with '.' in terminal references
        const from = conn.from.replace(':', '.');
        const to = conn.to.replace(':', '.');

        return {
            ...conn,
            id,
            from,
            to,
            // optional: ensure other fields exist
            label: conn.label ?? null,
        };
    });

    return {
        ...circuit,
        components: convertedComponents,
        connections: convertedConnections,
    };
}