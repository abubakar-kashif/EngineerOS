# backend/app/services/engine_adapter.py
import json
import subprocess
import os
from typing import Dict, Any

def run_engine(circuit_definition: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calls the Node.js runner with the circuit definition.
    Returns the SimulationResult from the engine.
    """
    runner_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "engine_runner",
        "runner.ts"
    )

    input_data = json.dumps({"circuitDefinition": circuit_definition})

    # Quote path so spaces in Windows user dirs do not break npx/tsx
    quoted_runner = f'"{runner_path}"' if " " in runner_path else runner_path

    # Use shell=True so npx is found on Windows
    result = subprocess.run(
        f"npx tsx {quoted_runner}",
        input=input_data,
        capture_output=True,
        text=True,
        check=False,
        shell=True,
        cwd=os.path.dirname(runner_path),
    )

    if result.returncode != 0:
        raise RuntimeError(f"Engine runner failed: {result.stderr}")

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse engine output: {e}")