// backend/engine_runner/runner.ts
import * as engine from '../../frontend/src/components/simulation/engine/index';
import { createTerminalId } from '../../frontend/src/components/simulation/engine/circuitGraph';

// Read stdin
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
            console.log(JSON.stringify(result));
            return;
        }

        // Solve
        const solution = engine.solveCircuit(circuitDef);
        console.log(JSON.stringify(solution));
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});

function convertToEngineFormat(circuit: any): any {
    // Convert components: turn terminal strings into objects
    const components = circuit.components.map((comp: any) => {
        let terminals = comp.terminals || [];
        if (Array.isArray(terminals) && terminals.length > 0 && typeof terminals[0] === 'string') {
            terminals = terminals.map((t: string) => ({
                id: createTerminalId(comp.id, t),
                type: t,
                componentId: comp.id
            }));
        }
        const position = comp.position || { x: 0, y: 0 };
        return {
            ...comp,
            terminals,
            position,
        };
    });

    // Convert connections: replace ':' with '.' for terminal IDs and add an id
    const connections = circuit.connections.map((conn: any, index: number) => ({
        ...conn,
        id: conn.id || `conn_${index}_${Date.now()}`,   // <-- add id here
        from: conn.from.replace(':', '.'),
        to: conn.to.replace(':', '.')
    }));

    return {
        ...circuit,
        components,
        connections,
    };
}