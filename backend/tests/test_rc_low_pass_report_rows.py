"""RC low-pass reports must quote the AC sweep, not the DC bias point."""

from types import SimpleNamespace

from app.services.report_service import _measured_rows


def test_rc_low_pass_report_keeps_sweep_and_drops_dc_bias():
    run = SimpleNamespace(
        experiment_id="rc-low-pass-filter",
        circuit_definition={
            "components": [
                {"id": "V1", "type": "voltage_source", "label": "V1"},
                {"id": "R1", "type": "resistor", "label": "R1"},
                {"id": "C1", "type": "capacitor", "label": "C1"},
                {"id": "VM1", "type": "voltmeter", "label": "VM1"},
            ]
        },
        results={
            "measurements": {
                "totalVoltage": 5,
                "equivalentResistance": 1e12,
                "totalCurrent": 5e-12,
                "totalPower": 2.5e-11,
                "componentMeasurements": [
                    {
                        "componentId": "VM1",
                        "type": "voltmeter",
                        "voltage": 5,
                        "current": 0,
                        "power": 0,
                    },
                    {
                        "componentId": "__ohmmeter__",
                        "type": "ohmmeter",
                        "voltage": 0,
                        "current": 0,
                        "power": 0,
                    },
                ],
                "rcLowPass": {
                    "R": 1000,
                    "C": 1e-7,
                    "Vin": 5,
                    "driveFrequency": 500,
                    "fcTheoretical": 1591.55,
                    "fcSimulated": 1591.55,
                    "gainAtDrive": 0.957,
                    "attenuationDbAtDrive": -0.38,
                    "phaseAtDriveDeg": -17.44,
                },
                "frequencySweep": {
                    "response": [{"frequency": 500, "gain": 0.957}]
                },
            },
            "graphs": [
                {
                    "id": "frequency_response",
                    "metadata": {
                        "peakCurrentFrequency": 31830,
                        "f0Simulated": 31830,
                    },
                }
            ],
        },
    )

    rows = _measured_rows(run)
    labels = {row["label"] for row in rows}

    assert "Total Resistance" not in labels
    assert "Simulated f0" not in labels
    assert "Simulated Vout" not in labels
    assert "__ohmmeter__ Voltage" not in labels
    assert "Theoretical fc" in labels
    assert "Simulated fc" in labels
    assert "Gain at drive" in labels
    assert "Phase at drive" in labels
    assert "Sweep points" in labels
