"""Rich, structured educational content for the ten initial experiments.

Each entry answers the ten questions a proper laboratory exercise
should answer:

* What are we learning?            -> objective, learning_outcomes
* Why does it matter?              -> description, real_world_applications
* Where did it come from?          -> historical_background
* What do I need?                  -> components, prerequisites
* How do I build it?               -> circuit_diagram, procedure
* What should I observe?           -> observation_guidance, expected_results
* What can go wrong?               -> common_mistakes, safety_precautions
* Where is it used?                -> real_world_applications
* What should I calculate?         -> formulas, variables
* How do I verify it?              -> procedure, expected_results
"""

EXPERIMENTS: list[dict] = [
    {
        "id": "ohms-law",
        "title": "Ohm's Law",
        "slug": "ohms-law",
        "short_description": "Explore the relationship between voltage, current, and resistance.",
        "description": (
            "In this experiment, you will investigate Ohm's Law, the single most "
            "used relationship in electrical engineering. By driving a resistor "
            "with several known voltages and measuring the resulting current, you "
            "will see that current is directly proportional to voltage and "
            "inversely proportional to resistance."
        ),
        "objective": (
            "Understand and verify the relationship between voltage, current, and "
            "resistance in a simple DC resistive circuit."
        ),
        "theory": (
            "Ohm's Law states that the current I through a conductor between two "
            "points is directly proportional to the voltage V across the two "
            "points, with the constant of proportionality being the resistance R: "
            "V = I × R. Equivalently, I = V / R and R = V / I. The law is empirical "
            "— it describes how most metallic conductors and carbon/metal-film "
            "resistors behave at constant temperature. A component that obeys the "
            "relationship is called ohmic, and plotting V against I yields a "
            "straight line through the origin whose slope is R. Non-ohmic "
            "components (diodes, filaments) have a curve instead, which is exactly "
            "what the Diode Characteristics experiment explores."
        ),
        "difficulty": "Beginner",
        "category": "Circuit Fundamentals",
        "duration_minutes": 30,
        "status": "published",
        "historical_background": (
            "Georg Simon Ohm (1789–1854), a German schoolteacher and physicist, "
            "published the relationship in 1827 in his book 'Die galvanische Kette, "
            "mathematisch bearbeitet' (The Galvanic Circuit Investigated "
            "Mathematically). Using wires of different lengths and thicknesses, he "
            "measured how 'tension' (voltage) and current related. The physics "
            "community initially dismissed the work — his position was even "
            "downgraded — but the law became the foundation of circuit analysis. "
            "The unit of resistance, the ohm (Ω), was named in his honour in 1861, "
            "and in 2020 the SI redefined all electrical units by fixing the exact "
            "value of resistance."
        ),
        "learning_outcomes": [
            "State Ohm's Law and rearrange it to solve for V, I, or R",
            "Measure voltage and current correctly in a live circuit",
            "Verify that a fixed resistor is an ohmic (linear) component",
            "Explain the physical meaning of resistance as opposition to current flow",
        ],
        "prerequisites": [],
        "formulas": [
            {
                "expression": "V = I × R",
                "variables": [
                    {"symbol": "V", "name": "Voltage across the resistor (volts)"},
                    {"symbol": "I", "name": "Current through the resistor (amperes)"},
                    {"symbol": "R", "name": "Resistance (ohms)"},
                ],
            },
            {
                "expression": "I = V / R   and   R = V / I",
                "variables": [
                    {"symbol": "I", "name": "Current (amperes) — solved form"},
                    {"symbol": "R", "name": "Resistance (ohms) — solved form"},
                ],
            },
            {
                "expression": "P = V × I = I² × R",
                "variables": [
                    {"symbol": "P", "name": "Power dissipated in the resistor (watts)"},
                ],
            },
        ],
        "variables": [
            {"symbol": "V", "name": "Voltage", "unit": "volt (V)", "description": "Electrical potential difference across the resistor"},
            {"symbol": "I", "name": "Current", "unit": "ampere (A)", "description": "Rate of charge flow through the resistor"},
            {"symbol": "R", "name": "Resistance", "unit": "ohm (Ω)", "description": "Opposition to current; slope of the V-I line"},
            {"symbol": "P", "name": "Power", "unit": "watt (W)", "description": "Heat dissipated by the resistor"},
        ],
        "components": [
            {"name": "Adjustable DC voltage source", "quantity": 1, "spec": "0–12 V"},
            {"name": "Resistor R", "quantity": 1, "spec": "1 kΩ, 1/4 W, 5% tolerance"},
            {"name": "Digital multimeter (DMM)", "quantity": 2, "spec": "One as voltmeter, one as ammeter"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "  +-------[ A ]-------+\n"
                "  |                  |\n"
                " +--+             +--+--+\n"
                " | V |           |  R  |\n"
                " |src|           | 1kΩ |\n"
                " +--+             +--+--+\n"
                "  |                  |\n"
                "  +-----( V across R )-+"
            ),
            "caption": (
                "The ammeter (A) sits in series with R so the same current flows "
                "through it; the voltmeter (V) measures across R without breaking "
                "the circuit."
            ),
        },
        "procedure": [
            "Set the voltage source to 0 V and build the circuit on the breadboard: source in series with R.",
            "Break the loop at one point and insert the ammeter in series to measure current.",
            "Connect the voltmeter in parallel across the resistor terminals.",
            "Apply 2 V, wait a moment for the reading to settle, and record the current and voltage.",
            "Repeat for 4 V, 6 V, 8 V, and 10 V, recording V and I each time.",
            "Calculate R = V / I for every row and confirm it is (nearly) constant.",
            "Plot V on the vertical axis against I on the horizontal axis and fit a straight line.",
            "Compare the fitted slope and the calculated R with the resistor's marked value, allowing for its 5% tolerance.",
        ],
        "expected_results": [
            "Each calculated R = V / I should match the marked 1 kΩ within ±5% tolerance.",
            "Doubling the voltage should double the measured current — current is proportional to voltage.",
            "The V-I plot should be a straight line passing through the origin.",
            "Power P = I² × R should stay well below the resistor's 1/4 W rating at all test voltages.",
        ],
        "common_mistakes": [
            {
                "mistake": "Inserting the ammeter in parallel with the resistor",
                "consequence": "The ammeter's near-zero resistance creates a short circuit; the meter fuse can blow or the source current-limits.",
            },
            {
                "mistake": "Measuring resistance while the circuit is powered",
                "consequence": "The ohmmeter reading is corrupted by the live circuit and can damage the meter.",
            },
            {
                "mistake": "Using a resistor with too small a power rating at high voltage",
                "consequence": "The resistor overheats, drifts in value, or burns out.",
            },
            {
                "mistake": "Reading the meter scale wrong (mA vs A, or the wrong DMM jack)",
                "consequence": "Results are off by a factor of 1000, breaking the proportionality check.",
            },
        ],
        "safety_precautions": [
            "Keep source voltages at or below 12 V for this experiment.",
            "Verify polarity of the ammeter (current enters the + terminal) before switching on.",
            "Turn the source output off while rewiring; never short the source terminals directly.",
            "Touch a resistor briefly after high-power runs — it can be surprisingly warm.",
        ],
        "observation_guidance": [
            "Watch how the current reading tracks the voltage knob instantly — evidence of proportionality.",
            "Note small deviations from exact proportionality caused by meter burden and lead resistance.",
            "Listen and look: a resistor running near its power limit may show discoloration.",
            "Reverse the source leads briefly and confirm the ammeter simply reads negative — the law is direction-agnostic.",
        ],
        "real_world_applications": [
            "Current-limiting resistors protect LEDs, sensors, and microcontroller pins everywhere.",
            "Shunt resistors convert current into a measurable voltage in power meters and battery monitors.",
            "Household appliances are rated by applying Ohm's Law to deliver specified power at 120/230 V.",
            "Electricians estimate circuit loading (and breaker sizing) from appliance resistance and supply voltage.",
        ],
        "related_experiments": ["series-circuit", "voltage-divider", "led-circuit"],
        "simulation_configuration": {"mode": "series", "parameters": {"voltage": 9, "r1": 1000}},
    },
    {
        "id": "series-circuit",
        "title": "Series Circuit",
        "slug": "series-circuit",
        "short_description": "Analyze the behavior of components connected in series.",
        "description": (
            "This experiment explores how resistors behave when connected in "
            "series — end to end, forming a single path for current. You will "
            "verify that the current is identical at every point in the loop while "
            "the supply voltage divides across the resistors in proportion to "
            "their resistances."
        ),
        "objective": (
            "Understand how voltage divides across series components and how "
            "current remains constant in a series circuit."
        ),
        "theory": (
            "In a series circuit there is exactly one path for current, so the "
            "same current flows through every component — charge cannot pile up "
            "or vanish anywhere in the loop. The total resistance is the sum of "
            "the individual resistances, R_total = R1 + R2 + … + Rn, because the "
            "electrons must push through each opposition one after another. The "
            "supply voltage then divides across the resistors in proportion to "
            "each resistance (Vn = I × Rn), and the drops always sum to the supply "
            "voltage — a direct consequence of Kirchhoff's Voltage Law. Series "
            "connection is used to increase total resistance, share voltage, or "
            "chain components like old fairy lights."
        ),
        "difficulty": "Beginner",
        "category": "Circuit Fundamentals",
        "duration_minutes": 35,
        "status": "published",
        "historical_background": (
            "Series connections predate formal circuit theory: Volta's 1800 "
            "'pile' — the first battery — stacked copper and zinc discs in "
            "series, adding their individual voltages into a useful total. "
            "When Ohm formalised resistance in 1827 and Kirchhoff added his "
            "loop and node laws in 1845, series networks became the textbook "
            "first case of analysis. Today the same mathematics sizes resistive "
            "dividers, battery packs (cells in series sum to pack voltage), and "
            "voltage-drop calculations in wiring installations."
        ),
        "learning_outcomes": [
            "Explain why current is identical at every point of a series loop",
            "Calculate total resistance as the sum of individual resistances",
            "Predict individual voltage drops using the voltage-divider ratio",
            "Verify experimentally that the drops sum to the supply voltage",
        ],
        "prerequisites": ["ohms-law"],
        "formulas": [
            {
                "expression": "R_total = R₁ + R₂ + … + Rₙ",
                "variables": [
                    {"symbol": "R_total", "name": "Total (equivalent) resistance"},
                    {"symbol": "Rₙ", "name": "Individual resistances in the chain"},
                ],
            },
            {
                "expression": "I = V_supply / R_total",
                "variables": [
                    {"symbol": "I", "name": "Current (same everywhere in the loop)"},
                    {"symbol": "V_supply", "name": "Source voltage"},
                ],
            },
            {
                "expression": "Vₙ = I × Rₙ   and   V₁ + V₂ + … + Vₙ = V_supply",
                "variables": [
                    {"symbol": "Vₙ", "name": "Voltage across the n-th resistor"},
                ],
            },
        ],
        "variables": [
            {"symbol": "I", "name": "Loop current", "unit": "ampere (A)", "description": "Identical through every series component"},
            {"symbol": "Vₙ", "name": "Component voltage", "unit": "volt (V)", "description": "Drop across each resistor, proportional to its resistance"},
            {"symbol": "R_total", "name": "Total resistance", "unit": "ohm (Ω)", "description": "Sum of all series resistances"},
        ],
        "components": [
            {"name": "DC voltage source", "quantity": 1, "spec": "0–12 V, fixed at 9 V for the runs"},
            {"name": "Resistor R1", "quantity": 1, "spec": "1 kΩ, 1/4 W"},
            {"name": "Resistor R2", "quantity": 1, "spec": "2.2 kΩ, 1/4 W"},
            {"name": "Resistor R3", "quantity": 1, "spec": "3.3 kΩ, 1/4 W (optional third stage)"},
            {"name": "Digital multimeter", "quantity": 2, "spec": "Ammeter + voltmeter duty"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "  +----[A]----+----+----+\n"
                "  |           |    |    |\n"
                " +--+        [R1] [R2] [R3]\n"
                " | V |         |    |    |\n"
                " |src|         |    |    |\n"
                " +--+          |    |    |\n"
                "  |            |    |    |\n"
                "  +------------+----+----+"
            ),
            "caption": (
                "One loop, one current: the ammeter anywhere in the chain reads "
                "the same value, and each resistor's drop is measured across it."
            ),
        },
        "procedure": [
            "Measure and record the actual resistance of each resistor before building anything.",
            "Connect R1 and R2 (then R3) end to end in a single chain on the breadboard.",
            "Attach the voltage source across the whole chain; set it to 9 V.",
            "Insert the ammeter between the source and the chain — record the current I.",
            "Move the ammeter to the other side of the chain and confirm the same current I.",
            "Measure the voltage across each resistor individually (V1, V2, V3).",
            "Add the measured drops and compare the sum to the supply voltage.",
            "Predict each drop with Vₙ = I × Rₙ using your measured resistance values and compare with the measurements.",
        ],
        "expected_results": [
            "The current is the same wherever it is measured in the loop.",
            "Larger resistors carry proportionally larger voltage drops.",
            "The sum of the drops equals the supply voltage within measurement error (a few millivolts).",
            "R_total computed from V_supply / I matches R1 + R2 (+ R3) within tolerance.",
        ],
        "common_mistakes": [
            {
                "mistake": "Bridging two breadboard rows so a resistor is bypassed",
                "consequence": "The 'measured' drop is near zero and the sums refuse to close.",
            },
            {
                "mistake": "Measuring voltage with the meter in current mode",
                "consequence": "The meter effectively shorts the resistor being probed and can blow its fuse.",
            },
            {
                "mistake": "Assuming the marked resistance is the real resistance",
                "consequence": "Predictions disagree with measurements by up to 5% before wiring errors are even considered.",
            },
        ],
        "safety_precautions": [
            "Keep the source at or below 12 V.",
            "Switch the source off while moving the ammeter between positions.",
            "Check that total power I² × R_total stays below each resistor's 1/4 W rating.",
        ],
        "observation_guidance": [
            "Notice the ammeter reading is rock-steady wherever it sits in the loop.",
            "Watch each voltmeter probe pair: drops scale visibly with resistance.",
            "Unscrew one resistor leg — the entire circuit stops: a series loop has no alternate path.",
            "Feel the resistors: power distributes in proportion to resistance in series.",
        ],
        "real_world_applications": [
            "Battery packs stack cells in series to reach higher voltages (e.g. 4 × 1.5 V ≈ 6 V).",
            "Voltage dividers and sensor bias networks are two resistors in series.",
            "Fuse and switch placement relies on series interruption opening the whole loop.",
            "Old-style holiday fairy lights wired the bulbs in series — one failure darkened the string.",
        ],
        "related_experiments": ["ohms-law", "parallel-circuit", "voltage-divider", "kvl"],
        "simulation_configuration": {"mode": "series", "parameters": {"voltage": 12, "r1": 1000, "r2": 2200}},
    },
    {
        "id": "parallel-circuit",
        "title": "Parallel Circuit",
        "slug": "parallel-circuit",
        "short_description": "Analyze the behavior of components connected in parallel.",
        "description": (
            "This experiment explores how resistors behave when connected in "
            "parallel — all tops tied together and all bottoms tied together, so "
            "each branch sees the full supply voltage. You will verify that the "
            "branch currents add at the junction and that the total resistance is "
            "always less than the smallest branch resistance."
        ),
        "objective": (
            "Understand how current divides across parallel branches and how "
            "voltage remains the same across each branch."
        ),
        "theory": (
            "In a parallel circuit every branch connects the same two nodes, so "
            "every branch experiences the same voltage — the full supply. Each "
            "branch then draws its own current independently according to Ohm's "
            "Law, Iₙ = V / Rₙ. Charge is conserved at the junction, so the supply "
            "current is the sum of the branch currents (Kirchhoff's Current Law). "
            "The equivalent resistance satisfies 1/R_total = 1/R₁ + 1/R₂ + … + "
            "1/Rₙ; adding a parallel branch always lowers the total resistance "
            "because it opens an additional path for current. This is why homes "
            "are wired in parallel: every appliance gets full mains voltage and "
            "works independently."
        ),
        "difficulty": "Beginner",
        "category": "Circuit Fundamentals",
        "duration_minutes": 35,
        "status": "published",
        "historical_background": (
            "Parallel distribution became practical with Edison's 1882 Pearl "
            "Street DC station, where lamps connected in parallel across mains "
            "wires — each receiving full voltage and burning independently. "
            "Kirchhoff had already formalised the junction rule in 1845, but "
            "large-scale parallel wiring forced engineers to think hard about "
            "conductor sizing and protection. The same junction mathematics now "
            "governs power grids, USB hubs, and multicore battery-management "
            "systems."
        ),
        "learning_outcomes": [
            "Explain why every parallel branch sees the same voltage",
            "Apply the reciprocal formula for equivalent parallel resistance",
            "Verify that branch currents sum to the total supply current",
            "Show that adding a parallel branch decreases total resistance",
        ],
        "prerequisites": ["ohms-law"],
        "formulas": [
            {
                "expression": "1/R_total = 1/R₁ + 1/R₂ + … + 1/Rₙ",
                "variables": [
                    {"symbol": "R_total", "name": "Equivalent parallel resistance"},
                    {"symbol": "Rₙ", "name": "Individual branch resistances"},
                ],
            },
            {
                "expression": "I_total = I₁ + I₂ + … + Iₙ",
                "variables": [
                    {"symbol": "I_total", "name": "Total current from the source"},
                    {"symbol": "Iₙ", "name": "Current in each branch"},
                ],
            },
            {
                "expression": "Iₙ = V / Rₙ   (same V for every branch)",
                "variables": [
                    {"symbol": "V", "name": "Common voltage across all branches"},
                    {"symbol": "Iₙ", "name": "Current drawn by branch n"},
                ],
            },
        ],
        "variables": [
            {"symbol": "V", "name": "Branch voltage", "unit": "volt (V)", "description": "Identical across all parallel branches"},
            {"symbol": "Iₙ", "name": "Branch current", "unit": "ampere (A)", "description": "Independent per branch, set by V / Rₙ"},
            {"symbol": "I_total", "name": "Total current", "unit": "ampere (A)", "description": "Sum of branch currents at the supply node"},
        ],
        "components": [
            {"name": "DC voltage source", "quantity": 1, "spec": "0–12 V, fixed at 9 V"},
            {"name": "Resistor R1", "quantity": 1, "spec": "1 kΩ, 1/4 W"},
            {"name": "Resistor R2", "quantity": 1, "spec": "2.2 kΩ, 1/4 W"},
            {"name": "Digital multimeter", "quantity": 2, "spec": "Ammeter + voltmeter duty"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "        +-------+-------+\n"
                "        |       |       |\n"
                "  +-----+       |       |\n"
                "  |   [A1]     [A2]      |\n"
                " +--+    |       |       |\n"
                " | V |  [R1]   [R2]     |\n"
                " |src|    |       |       |\n"
                " +--+     |       |       |\n"
                "  |       |       |       |\n"
                "  +-------+-------+-------+"
            ),
            "caption": (
                "Both branches connect the same two rails, so each sees 9 V; "
                "ammeters in each branch (plus one at the source) verify KCL."
            ),
        },
        "procedure": [
            "Measure and record the actual value of each resistor.",
            "Connect R1 and R2 in parallel: both left legs on one breadboard rail, both right legs on another.",
            "Connect the 9 V source across the two rails.",
            "Measure the voltage across each branch — confirm both readings equal the supply.",
            "Break each branch in turn and insert the ammeter to record I₁ and I₂.",
            "Insert the ammeter between the source and the rails to record I_total.",
            "Compare I_total with I₁ + I₂.",
            "Calculate R_total from V / I_total and check it against the reciprocal formula; confirm it is smaller than the smallest branch resistor.",
        ],
        "expected_results": [
            "Branch voltages are equal to the supply voltage within meter error.",
            "The lower-resistance branch carries the larger current (1 kΩ branch draws ~2.2× the 2.2 kΩ branch at 9 V).",
            "I_total equals I₁ + I₂ to within a fraction of a milliamp.",
            "R_total (≈ 688 Ω) is less than both 1 kΩ and 2.2 kΩ.",
        ],
        "common_mistakes": [
            {
                "mistake": "Plugging the ammeter across a rail pair to 'measure branch current'",
                "consequence": "The ammeter shorts the supply; the fuse blows or the source current-limits.",
            },
            {
                "mistake": "Assuming currents are equal in both branches",
                "consequence": "Predictions ignore the inverse relationship between R and I.",
            },
            {
                "mistake": "Adding resistances instead of reciprocals",
                "consequence": "R_total comes out larger than reality — the single most common parallel-circuit error.",
            },
        ],
        "safety_precautions": [
            "Never insert an ammeter directly across the source rails.",
            "Power off while re-wiring branches.",
            "Confirm each branch's power (V²/R) stays below the resistor's rating.",
        ],
        "observation_guidance": [
            "Remove one branch entirely — the other keeps working, unaffected: independence is the signature of parallel wiring.",
            "Add a third branch and watch the total current climb while branch voltages stay fixed.",
            "Notice the smaller resistor feels warmer — it dissipates more power at the same voltage.",
            "Compare the source current to the sum on your notepad as branches change.",
        ],
        "real_world_applications": [
            "Household outlets: every appliance receives the full mains voltage independently.",
            "Car electrical systems power headlights, radio, and ECU as parallel loads off one 12 V bus.",
            "Parallel (redundant) power supplies share load in servers and telecom racks.",
            "Parallel resistor pairs create fine-grained standard values from coarse series values.",
        ],
        "related_experiments": ["series-circuit", "current-divider", "kcl"],
        "simulation_configuration": {"mode": "parallel", "parameters": {"voltage": 9, "r1": 1000, "r2": 2200}},
    },
    {
        "id": "kvl",
        "title": "Kirchhoff's Voltage Law",
        "slug": "kvl",
        "short_description": "Verify Kirchhoff's Voltage Law in a circuit.",
        "description": (
            "This experiment verifies Kirchhoff's Voltage Law — the energy "
            "conservation principle of circuits. Walking around any closed loop, "
            "you will measure every voltage rise and drop with careful attention to "
            "sign, then show that they sum to zero."
        ),
        "objective": (
            "Validate Kirchhoff's Voltage Law by measuring the signed voltages "
            "around a closed loop and showing their algebraic sum is zero."
        ),
        "theory": (
            "Kirchhoff's Voltage Law (KVL) states that the algebraic sum of all "
            "voltages around any closed loop is zero: ΣV = 0. Voltage is energy "
            "per unit charge, and a charge that returns to its starting point must "
            "have gained exactly as much energy in the source as it lost in the "
            "components — otherwise energy would be created or destroyed, which "
            "conservation forbids. In practice you adopt a walking direction "
            "(say clockwise), record each voltage as positive when you traverse "
            "from − to + (a rise, the source) and negative from + to − (a drop, "
            "the resistors), and add. Sign discipline is the whole skill: with the "
            "same multimeter probes, a reading that flips sign when you reverse "
            "the probes is telling you the polarity you assumed was backwards."
        ),
        "difficulty": "Intermediate",
        "category": "Circuit Fundamentals",
        "duration_minutes": 40,
        "status": "published",
        "historical_background": (
            "Gustav Robert Kirchhoff (1824–1887) published his two circuit laws "
            "in 1845 while still a student at the University of Königsberg — "
            "work he extended in 1857 to the telegraph equations, anticipating "
            "some of Maxwell's results. KVL and KCL turned circuit analysis from "
            "a collection of empirical tricks into an algebraic procedure. Every "
            "SPICE simulator, every power-system load flow, and every loop/node "
            "equation students solve today descends from those two laws."
        ),
        "learning_outcomes": [
            "State KVL and its link to conservation of energy",
            "Apply a consistent sign convention when traversing a loop",
            "Measure and sum signed voltages around a multi-component loop",
            "Use KVL to predict an unknown voltage drop",
        ],
        "prerequisites": ["series-circuit"],
        "formulas": [
            {
                "expression": "ΣV = 0   (around any closed loop)",
                "variables": [
                    {"symbol": "ΣV", "name": "Algebraic sum of rises (+) and drops (−) around the loop"},
                ],
            },
            {
                "expression": "V_source = V₁ + V₂ + V₃",
                "variables": [
                    {"symbol": "V_source", "name": "Voltage rise delivered by the source"},
                    {"symbol": "Vₙ", "name": "Voltage drops across the series resistors"},
                ],
            },
        ],
        "variables": [
            {"symbol": "ΣV", "name": "Loop voltage sum", "unit": "volt (V)", "description": "Must equal zero for any closed traversal"},
            {"symbol": "Vₙ", "name": "Component drop", "unit": "volt (V)", "description": "Signed with respect to the chosen walking direction"},
        ],
        "components": [
            {"name": "DC voltage source", "quantity": 1, "spec": "9 V fixed"},
            {"name": "Resistor R1", "quantity": 1, "spec": "1 kΩ, 1/4 W"},
            {"name": "Resistor R2", "quantity": 1, "spec": "2.2 kΩ, 1/4 W"},
            {"name": "Resistor R3", "quantity": 1, "spec": "3.3 kΩ, 1/4 W"},
            {"name": "Digital multimeter", "quantity": 1, "spec": "Voltmeter mode, note sign of displayed value"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "        (walking direction →)\n"
                "  +----→-----+-----→-----+\n"
                "  |          |           |\n"
                " +--+       [R1]        [R3]\n"
                " | V |        |           |\n"
                " |src|       [R2]         |\n"
                " +--+         |           |\n"
                "  |           +-----→-----+\n"
                "  +---------------------->"
            ),
            "caption": (
                "One source, three series resistors. Walk clockwise: the source "
                "is a rise (+), each resistor is a drop (−); the signed sum must "
                "be zero."
            ),
        },
        "procedure": [
            "Build the loop: source in series with R1, R2, R3 (R2 and R3 in chain or parallel — keep one series chain for the first pass).",
            "Choose a walking direction (clockwise) and label the + and − ends of each element using current flow from the source's + terminal.",
            "Measure the source voltage with the voltmeter; note it as a positive rise in your walking direction.",
            "Measure each resistor's voltage, keeping the probe order consistent with the walk: + to − is a drop (negative contribution).",
            "Reverse the probes on one resistor deliberately and confirm the meter sign flips — this is how polarity is determined.",
            "Sum all signed voltages around the loop; record the result.",
            "Repeat the full walk in the counter-clockwise direction; the sum should still be zero.",
            "Predict the drop across R2 from the other measured drops and Ohm's Law, then verify it with the meter.",
        ],
        "expected_results": [
            "The algebraic sum of the signed voltages is within a few millivolts of zero.",
            "Reversing the walking direction flips every sign individually but the sum remains zero.",
            "Resistor drops are proportional to resistance (1 kΩ : 2.2 kΩ : 3.3 kΩ).",
            "The residual (non-zero) sum is bounded by the meter's accuracy, not by circuit behaviour.",
        ],
        "common_mistakes": [
            {
                "mistake": "Adding all magnitudes without signs",
                "consequence": "The sum equals twice the supply voltage instead of zero.",
            },
            {
                "mistake": "Swapping probe order between measurements",
                "consequence": "Random sign errors make the loop refuse to close.",
            },
            {
                "mistake": "Measuring a 'loop' that is actually two loops at once",
                "consequence": "KVL only applies to a single closed path; mixing paths gives a meaningless sum.",
            },
        ],
        "safety_precautions": [
            "Stay at or below 12 V for the source.",
            "Keep the voltmeter in voltage mode — the meter is across components, never in series here.",
            "Power down when re-labeling element polarities with a pen.",
        ],
        "observation_guidance": [
            "Watch the meter's minus sign appear when a probe pair disagrees with your assumed polarity.",
            "Observe that the largest resistor always shows the largest drop in a series loop.",
            "Change the walking direction on paper only — the physical readings are unchanged.",
            "Add a fourth resistor and re-walk: the drops re-divide, but the sum stays zero.",
        ],
        "real_world_applications": [
            "Ground-referenced voltage probing in embedded design is applied KVL.",
            "Power-system load-flow studies solve giant KVL/KCL equation sets.",
            "Battery-management systems sum cell voltages around pack loops for balancing.",
            "Circuit simulators (SPICE) literally build their equations from KVL and KCL.",
        ],
        "related_experiments": ["series-circuit", "kcl", "voltage-divider"],
        "simulation_configuration": {"mode": "series", "parameters": {"voltage": 9, "r1": 1000, "r2": 2200}},
    },
    {
        "id": "kcl",
        "title": "Kirchhoff's Current Law",
        "slug": "kcl",
        "short_description": "Verify Kirchhoff's Current Law in a circuit.",
        "description": (
            "This experiment verifies Kirchhoff's Current Law — the charge "
            "conservation principle of circuits. At a junction where three or more "
            "branches meet, you will measure every current entering and leaving "
            "and show that they balance exactly."
        ),
        "objective": (
            "Validate Kirchhoff's Current Law by measuring branch currents at a "
            "multi-branch node and showing that what flows in equals what flows out."
        ),
        "theory": (
            "Kirchhoff's Current Law (KCL) states that the algebraic sum of "
            "currents at any node is zero: charge entering equals charge "
            "leaving. Because charge is conserved, no node can accumulate it — "
            "a node is not a storage device. Mathematically, ΣI_in = ΣI_out for "
            "every node. KCL is what makes the parallel-circuit behaviour you saw "
            "earlier inevitable: supply current is the sum of branch currents. "
            "Combined with KVL it yields the node-voltage and mesh-current "
            "analysis methods that professional engineers use for circuits far "
            "too complex for back-of-envelope Ohm's Law reasoning."
        ),
        "difficulty": "Intermediate",
        "category": "Circuit Fundamentals",
        "duration_minutes": 40,
        "status": "published",
        "historical_background": (
            "Kirchhoff's junction rule, published alongside the loop rule in "
            "1845, is the electrical statement of continuity of charge — the "
            "same principle behind fluid-flow accounting at a pipe junction. "
            "The law underlies every node-based solver written since, from "
            "SPICE's sparse-matrix engines to power-grid state estimators that "
            "reconcile thousands of meter readings per second."
        ),
        "learning_outcomes": [
            "State KCL and its link to conservation of charge",
            "Identify nodes and label current directions consistently",
            "Measure branch currents and verify the node balance",
            "Apply KCL to solve for one unknown branch current",
        ],
        "prerequisites": ["parallel-circuit"],
        "formulas": [
            {
                "expression": "ΣI_in = ΣI_out   (at any node)",
                "variables": [
                    {"symbol": "ΣI_in", "name": "Sum of currents entering the node"},
                    {"symbol": "ΣI_out", "name": "Sum of currents leaving the node"},
                ],
            },
            {
                "expression": "I_source = I₁ + I₂ + I₃",
                "variables": [
                    {"symbol": "I_source", "name": "Current supplied to the node"},
                    {"symbol": "Iₙ", "name": "Currents carried away by each branch"},
                ],
            },
        ],
        "variables": [
            {"symbol": "ΣI", "name": "Node current sum", "unit": "ampere (A)", "description": "Algebraic sum over the node; must be zero"},
            {"symbol": "Iₙ", "name": "Branch current", "unit": "ampere (A)", "description": "Signed positive when defined as entering the node"},
        ],
        "components": [
            {"name": "DC voltage source", "quantity": 1, "spec": "9 V fixed"},
            {"name": "Resistor R1", "quantity": 1, "spec": "1 kΩ, 1/4 W"},
            {"name": "Resistor R2", "quantity": 1, "spec": "2.2 kΩ, 1/4 W"},
            {"name": "Resistor R3", "quantity": 1, "spec": "3.3 kΩ, 1/4 W"},
            {"name": "Digital multimeter", "quantity": 1, "spec": "Ammeter mode, series insertion"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "            node N\n"
                "  +-----------+-----------+\n"
                "  |           |           |\n"
                " [R1]       [R2]        [R3]\n"
                "  |           |           |\n"
                "  |    +------+           |\n"
                "  |    |                  |\n"
                " +--+  |                  |\n"
                " | V |← I_source          |\n"
                " +--+  |                  |\n"
                "  |    +------------------+"
            ),
            "caption": (
                "Three branches meet at node N. KCL: I_source = I₁ + I₂ + I₃, "
                "where each branch current is V/Rₙ with the same V across it."
            ),
        },
        "procedure": [
            "Build three parallel branches (R1, R2, R3) between two shared rails; the top rail contains your node N.",
            "Label the defined direction of every branch current (away from N) on your schematic.",
            "Insert the ammeter between the source and node N; record I_source.",
            "Insert the ammeter in series with R1; record I₁ (and its sign relative to your label).",
            "Repeat for R2 and R3 to record I₂ and I₃.",
            "Sum I₁ + I₂ + I₃ and compare with I_source.",
            "Reverse the ammeter leads on one branch deliberately and note the sign flip — entering vs leaving.",
            "Remove R3, then re-measure I_source and confirm it now equals I₁ + I₂.",
        ],
        "expected_results": [
            "I_source equals the sum of the three branch currents within meter accuracy (tens of microamps).",
            "Each branch current individually matches V/Rₙ predicted from the measured rail voltage.",
            "After removing R3, the total drops by exactly the old I₃ contribution.",
            "Sign flips are consistent: reversing leads changes the reading sign but not the balance.",
        ],
        "common_mistakes": [
            {
                "mistake": "Treating two separate breadboard rails as one node",
                "consequence": "Currents 'vanish' through a hidden path and the balance fails.",
            },
            {
                "mistake": "Placing the ammeter in parallel with a branch",
                "consequence": "The branch is shorted and the meter fuse is at risk.",
            },
            {
                "mistake": "Forgetting the ammeter's own small resistance in tight measurements",
                "consequence": "Each insertion slightly changes the branch current, adding small systematic errors.",
            },
        ],
        "safety_precautions": [
            "Ammeter only ever in series — double-check before powering on.",
            "Power off between ammeter relocations.",
            "Keep the source at or below 12 V.",
        ],
        "observation_guidance": [
            "Watch the total current fall the instant you pull a branch — the node rebalances immediately.",
            "Notice each branch current is stable and independent of the others.",
            "Add a fourth branch and see I_source rise by exactly the new V/R₄.",
            "Compare your column of predicted branch currents to the measured ones — the residuals should be tiny and unbiased.",
        ],
        "real_world_applications": [
            "Current-summing in battery-management systems measures pack current by balancing branch currents.",
            "Ground planes in PCBs are giant nodes; KCL governs every via and return path.",
            "Residual-current devices (RCDs/GFCIs) trip when KCL fails — live and neutral currents no longer balance.",
            "Current mirrors and summing amplifiers are KCL designed on purpose.",
        ],
        "related_experiments": ["parallel-circuit", "current-divider", "kvl"],
        "simulation_configuration": {"mode": "parallel", "parameters": {"voltage": 9, "r1": 1000, "r2": 2200}},
    },
    {
        "id": "voltage-divider",
        "title": "Voltage Divider",
        "slug": "voltage-divider",
        "short_description": "Explore the voltage divider circuit.",
        "description": (
            "This experiment investigates the voltage divider — two resistors in "
            "series that produce a predictable fraction of the input voltage at "
            "their junction. It is the most-built circuit in electronics, and this "
            "session teaches both its power and its limits."
        ),
        "objective": (
            "Understand how to calculate, build, and measure a voltage divider — "
            "and how loading changes its output."
        ),
        "theory": (
            "A voltage divider is two resistors in series across a source. The "
            "same current flows through both, so the output taken across R2 is "
            "V_out = V_in × R2 / (R1 + R2) — purely a ratio of resistances. The "
            "divider is exact only when nothing draws current from the output: "
            "any load R_L appears in parallel with R2, lowering the effective "
            "lower leg and dragging V_out down. Design rule of thumb: keep the "
            "divider current at least 10× the load current so the loading error "
            "stays under 10%. Dividers are also the core of sensor interfaces: "
            "thermistors and LDRs form the variable leg, converting resistance "
            "into a voltage an ADC can read."
        ),
        "difficulty": "Intermediate",
        "category": "Circuit Fundamentals",
        "duration_minutes": 35,
        "status": "published",
        "historical_background": (
            "The divider is as old as Ohm's Law itself — as soon as resistances "
            "in series were understood (1827), engineers used the ratio to "
            "derive reference voltages. The moving-coil voltmeters of the late "
            "1800s used series multipliers (a divider with the meter as the "
            "lower leg) to scale their ranges. Today the same structure reads "
            "virtually every resistive sensor on earth and defines reference "
            "networks in billion-unit consumer electronics."
        ),
        "learning_outcomes": [
            "Derive and apply the voltage-divider equation",
            "Design a divider to hit a target output voltage from available resistor values",
            "Predict and measure the effect of a load on the output",
            "Explain why divider current should exceed load current by ~10×",
        ],
        "prerequisites": ["ohms-law", "series-circuit"],
        "formulas": [
            {
                "expression": "V_out = V_in × R₂ / (R₁ + R₂)",
                "variables": [
                    {"symbol": "V_out", "name": "Output voltage across R₂"},
                    {"symbol": "V_in", "name": "Input (supply) voltage"},
                    {"symbol": "R₁", "name": "Upper resistor"},
                    {"symbol": "R₂", "name": "Lower resistor"},
                ],
            },
            {
                "expression": "I_divider = V_in / (R₁ + R₂)",
                "variables": [
                    {"symbol": "I_divider", "name": "Quiescent current constantly drawn from the source"},
                ],
            },
            {
                "expression": "R₂' = (R₂ × R_L) / (R₂ + R_L)",
                "variables": [
                    {"symbol": "R_L", "name": "Load resistance attached to the output"},
                    {"symbol": "R₂'", "name": "Loaded (effective) lower leg"},
                ],
            },
        ],
        "variables": [
            {"symbol": "V_out", "name": "Output voltage", "unit": "volt (V)", "description": "Taken at the junction of R1 and R2"},
            {"symbol": "V_in", "name": "Input voltage", "unit": "volt (V)", "description": "Total voltage across the whole chain"},
            {"symbol": "I_divider", "name": "Divider current", "unit": "ampere (A)", "description": "Constant drain through the series pair"},
            {"symbol": "R_L", "name": "Load resistance", "unit": "ohm (Ω)", "description": "Resistance connected from the output to ground"},
        ],
        "components": [
            {"name": "DC voltage source", "quantity": 1, "spec": "9 V fixed"},
            {"name": "Resistor R1", "quantity": 1, "spec": "1 kΩ, 1/4 W"},
            {"name": "Resistor R2", "quantity": 1, "spec": "2.2 kΩ, 1/4 W"},
            {"name": "Resistor R_L (load)", "quantity": 1, "spec": "10 kΩ, 1/4 W — deliberately comparable to R2"},
            {"name": "Digital multimeter", "quantity": 1, "spec": "Voltmeter mode (10 MΩ input)"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "  +--------+--------+\n"
                "  |        |        |\n"
                " +--+     [R1]     |\n"
                " | V |      |      |\n"
                " |src|     [R2]   [R_L]\n"
                " +--+      |        |\n"
                "  |        +---+----+\n"
                "  |            ^\n"
                "  |          V_out (across R2)\n"
                "  +-------------------+"
            ),
            "caption": (
                "V_out is measured across R2. When the load R_L is attached it "
                "parallels R2 and pulls the output down."
            ),
        },
        "procedure": [
            "Build the unloaded divider: R1 from source + to the junction, R2 from junction to source −.",
            "Connect the 9 V source and measure V_in directly across the rails.",
            "Measure V_out at the junction; compare with 9 × 2.2 / (1 + 2.2).",
            "Swap R1 and R2 positions and verify the output becomes the complementary fraction.",
            "Calculate the divider current and its constant power draw.",
            "Attach the 10 kΩ load from the junction to ground and re-measure V_out.",
            "Predict the loaded output using R₂' = R2 ∥ R_L and compare with the measurement.",
            "BONUS: find two standard-value resistors in your kit that would give ~5 V from 9 V, build it, and verify.",
        ],
        "expected_results": [
            "Unloaded output ≈ 6.2 V (9 × 2.2/3.2) within resistor tolerance.",
            "Swapping the resistors gives ≈ 2.8 V — the two outputs sum to V_in.",
            "With the 10 kΩ load, V_out falls to ≈ 5.75 V: a visible, predictable loading error.",
            "The voltmeter itself (10 MΩ) causes negligible loading at kilohm scales.",
        ],
        "common_mistakes": [
            {
                "mistake": "Measuring V_out across R1 instead of R2",
                "consequence": "The reading is the complement of the expected value and conclusions invert.",
            },
            {
                "mistake": "Using very large resistors (MΩ) with a modest meter or load",
                "consequence": "The measuring instrument itself loads the divider and drags the output down.",
            },
            {
                "mistake": "Trying to power a load directly from a high-impedance divider",
                "consequence": "The output collapses under load — dividers are references, not power supplies.",
            },
            {
                "mistake": "Ignoring the divider's constant current drain in battery designs",
                "consequence": "The battery flattens long before the product is switched 'off'.",
            },
        ],
        "safety_precautions": [
            "Low voltages only — the main hazard here is wrong conclusions, not shocks.",
            "Confirm resistor values with the meter before trusting your ratio.",
            "Power down while swapping the load in and out.",
        ],
        "observation_guidance": [
            "Watch V_out sag the instant the load is attached — loading made visible.",
            "Probe the junction with the meter vs without it at 100:1 scale (e.g. 10 MΩ vs 100 kΩ) to feel meter burden.",
            "Note that both resistor drops sum to the supply — the divider is still a series circuit.",
            "Observe how a 10× stiffer divider (100 Ω legs) barely moves under the same load, at the cost of 90 mA of drain.",
        ],
        "real_world_applications": [
            "Thermistor and photoresistor (LDR) interfaces convert resistance to ADC-readable voltage.",
            "Volume knobs: a potentiometer is an adjustable divider feeding an amplifier.",
            "High-voltage probes divide 1000 V down to 1 V for safe metering.",
            "Bias networks set reference voltages for op-amps and transistor stages.",
        ],
        "related_experiments": ["series-circuit", "current-divider", "kvl"],
        "simulation_configuration": {"mode": "series", "parameters": {"voltage": 9, "r1": 1000, "r2": 2200}},
    },
    {
        "id": "current-divider",
        "title": "Current Divider",
        "slug": "current-divider",
        "short_description": "Explore the current divider circuit.",
        "description": (
            "This experiment investigates the current divider — the parallel-"
            "circuit counterpart of the voltage divider. A total current splits "
            "between two branches, and you will verify the counter-intuitive rule "
            "that the branch with lower resistance takes MORE of the current."
        ),
        "objective": (
            "Understand how current divides between parallel resistors and "
            "predict each branch current with the divider formula."
        ),
        "theory": (
            "In a parallel pair, both branches share the same voltage V, so each "
            "branch current is V/Rₙ. Expressed in terms of the total current, the "
            "current through R1 is I₁ = I_total × R2 / (R1 + R2) — note the "
            "crossover: R1's share is set by the OTHER resistor. The smaller "
            "resistance always conducts more current, and conductance (G = 1/R) "
            "makes this intuitive: currents divide in proportion to conductances, "
            "Iₙ = I_total × Gₙ / (G₁ + G₂ + …). Current dividers appear wherever "
            "a source or driver feeds multiple parallel loads: shunt design, "
            "parallel LED strings, and amplifier current-sharing networks."
        ),
        "difficulty": "Intermediate",
        "category": "Circuit Fundamentals",
        "duration_minutes": 35,
        "status": "published",
        "historical_background": (
            "The current divider follows immediately from Ohm's Law plus "
            "Kirchhoff's junction rule, so it has no single discoverer — it is "
            "part of the standard analysis toolkit that solidified in the late "
            "1800s. Its most consequential industrial use emerged in power "
            "distribution: parallel loads on a shared bus each draw current in "
            "proportion to their conductance, a principle electricians still "
            "apply when balancing panel loads today."
        ),
        "learning_outcomes": [
            "Apply the current-divider formula to predict branch currents",
            "Explain why branch current is set by the opposite resistor",
            "Verify that branch currents sum to the total current",
            "Contrast the current divider with the voltage divider",
        ],
        "prerequisites": ["ohms-law", "parallel-circuit"],
        "formulas": [
            {
                "expression": "I₁ = I_total × R₂ / (R₁ + R₂)",
                "variables": [
                    {"symbol": "I₁", "name": "Current through R₁"},
                    {"symbol": "I_total", "name": "Total current entering the pair"},
                    {"symbol": "R₁", "name": "Branch 1 resistance"},
                    {"symbol": "R₂", "name": "Branch 2 resistance"},
                ],
            },
            {
                "expression": "I₂ = I_total × R₁ / (R₁ + R₂)",
                "variables": [
                    {"symbol": "I₂", "name": "Current through R₂"},
                ],
            },
            {
                "expression": "Iₙ = I_total × Gₙ / ΣG",
                "variables": [
                    {"symbol": "Gₙ", "name": "Conductance of branch n (G = 1/R, siemens)"},
                    {"symbol": "ΣG", "name": "Sum of all branch conductances"},
                ],
            },
        ],
        "variables": [
            {"symbol": "I_total", "name": "Total current", "unit": "ampere (A)", "description": "Current supplied to the parallel pair"},
            {"symbol": "I₁, I₂", "name": "Branch currents", "unit": "ampere (A)", "description": "Split inversely to their resistances"},
            {"symbol": "G", "name": "Conductance", "unit": "siemens (S)", "description": "1/R; currents divide in proportion to G"},
        ],
        "components": [
            {"name": "DC voltage source", "quantity": 1, "spec": "9 V (a voltage source plus series resistor creates the total current)"},
            {"name": "Series source resistor R0", "quantity": 1, "spec": "470 Ω, 1/4 W — sets I_total"},
            {"name": "Resistor R1", "quantity": 1, "spec": "1 kΩ, 1/4 W"},
            {"name": "Resistor R2", "quantity": 1, "spec": "2.2 kΩ, 1/4 W"},
            {"name": "Digital multimeter", "quantity": 1, "spec": "Ammeter mode"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "        +-------+-------+\n"
                "        |       |       |\n"
                "  +----[R0]     |       |\n"
                "  |     |      [R1]    [R2]\n"
                " +--+    |       |       |\n"
                " | V |   |       |       |\n"
                " |src|   +-------+-------+\n"
                " +--+    ↑ I_total splits here\n"
                "  |                       |\n"
                "  +-----------------------+"
            ),
            "caption": (
                "R0 converts the 9 V source into a defined total current; that "
                "current then divides between R1 and R2 at the top node."
            ),
        },
        "procedure": [
            "Build the circuit: R0 in series from the source to a node, then R1 and R2 both from that node back to the source −.",
            "Calculate the expected I_total: 9 V ÷ (R0 + R1∥R2).",
            "Insert the ammeter where R0 meets the node; record the actual I_total.",
            "Insert the ammeter in series with R1; record I₁.",
            "Insert the ammeter in series with R2; record I₂.",
            "Check the balance: I₁ + I₂ ≈ I_total.",
            "Predict I₁ using the crossover formula I_total × R2/(R1 + R2) and compare.",
            "Swap R1 and R2 and confirm the currents swap with them.",
        ],
        "expected_results": [
            "I₁ ≈ I_total × 2.2/3.2 ≈ 69% of the total — the 1 kΩ branch takes the larger share.",
            "I₂ ≈ 31% of the total; the two branches sum back to I_total.",
            "With R0 = 470 Ω and the pair above, I_total ≈ 9 V ÷ (470 + 688) ≈ 7.8 mA.",
            "Swapping the resistors swaps the branch currents in the same ratio.",
        ],
        "common_mistakes": [
            {
                "mistake": "Assigning each branch current using its own resistor in the numerator",
                "consequence": "Predictions are inverted — the classic crossover trap of this circuit.",
            },
            {
                "mistake": "Forgetting the source's own series resistance",
                "consequence": "The measured I_total is lower than the naive V/R_parallel prediction.",
            },
            {
                "mistake": "Treating an ideal current source and a voltage source identically",
                "consequence": "A voltage source plus parallel pair is NOT a current divider — something must define I_total.",
            },
        ],
        "safety_precautions": [
            "Ammeter in series only; double-check placement before powering.",
            "Power off while moving the meter between branches.",
            "Confirm each branch's dissipation stays under 1/4 W.",
        ],
        "observation_guidance": [
            "Watch the smaller resistor's branch read the larger current — inverse proportionality in action.",
            "Add a third branch: the old branch currents are unchanged; only the total grows.",
            "Remove one branch entirely and see the remaining branch keep its exact current (voltage unchanged).",
            "Compare your measured split ratio with R2:R1 on paper — they should match within tolerance.",
        ],
        "real_world_applications": [
            "Shunt resistors: a small parallel resistance diverts a known fraction of current for measurement.",
            "Parallel LED strings rely on (or suffer from) current division between branches.",
            "Grounding networks split fault currents between electrodes and guards.",
            "Current mirrors steer current between matched transistors in analog IC design.",
        ],
        "related_experiments": ["parallel-circuit", "voltage-divider", "kcl"],
        "simulation_configuration": {"mode": "parallel", "parameters": {"voltage": 9, "r1": 1000, "r2": 2200}},
    },
    {
        "id": "rc-circuit",
        "title": "RC Circuit",
        "slug": "rc-circuit",
        "short_description": "Analyze the behavior of an RC circuit.",
        "description": (
            "This experiment explores the charging and discharging of a capacitor "
            "through a resistor. Unlike resistors, capacitors introduce TIME into "
            "circuit behaviour, and you will map the exponential curves that make "
            "timers, filters, and power-rail soft-starts possible."
        ),
        "objective": (
            "Understand the time-dependent behaviour of RC circuits by measuring "
            "the exponential charge and discharge of a capacitor."
        ),
        "theory": (
            "When a voltage step is applied to a series resistor-capacitor pair, "
            "the capacitor cannot change its voltage instantly — it integrates "
            "the current flowing into it. The result is an exponential: while "
            "charging, V_C(t) = V₀(1 − e^(−t/τ)); while discharging, V_C(t) = "
            "V₀ · e^(−t/τ). The time constant τ = R × C (seconds) sets the pace: "
            "after one τ the capacitor reaches 63.2% of its final value while "
            "charging (or falls to 36.8% while discharging); 'fully' charged is "
            "engineered as 5τ (99.3%). A larger R or C slows everything down. "
            "The same mathematics governs every first-order system in "
            "engineering — thermal masses, tank levels, and digital debounce "
            "circuits included."
        ),
        "difficulty": "Intermediate",
        "category": "Circuit Fundamentals",
        "duration_minutes": 45,
        "status": "published",
        "historical_background": (
            "The capacitor's ability to store charge was discovered "
            "serendipitously: Ewald Georg von Kleist (1745) and Pieter van "
            "Musschenbroek (1746) built the Leyden jar and were shocked — "
            "literally — by its discharge. Michael Faraday's work on "
            "electrostatics (1830s) gave the device its modern name and the "
            "farad unit. The exponential RC analysis arrived once calculus met "
            "circuit theory in the 19th century, and it became the workhorse "
            "model for first-order transients in every control and "
            "electronics textbook since."
        ),
        "learning_outcomes": [
            "Explain why capacitor voltage cannot change instantaneously",
            "Calculate the time constant τ = RC and use the 63%/37% landmarks",
            "Capture a charge and discharge curve and estimate τ from the data",
            "Relate RC behaviour to real timing and filtering applications",
        ],
        "prerequisites": ["ohms-law", "series-circuit"],
        "formulas": [
            {
                "expression": "τ = R × C",
                "variables": [
                    {"symbol": "τ", "name": "Time constant (seconds)"},
                    {"symbol": "R", "name": "Resistance (ohms)"},
                    {"symbol": "C", "name": "Capacitance (farads)"},
                ],
            },
            {
                "expression": "V_C(t) = V₀ × (1 − e^(−t/τ))   (charging)",
                "variables": [
                    {"symbol": "V_C(t)", "name": "Capacitor voltage at time t"},
                    {"symbol": "V₀", "name": "Final (supply) voltage"},
                ],
            },
            {
                "expression": "V_C(t) = V₀ × e^(−t/τ)   (discharging)",
                "variables": [
                    {"symbol": "V₀", "name": "Initial capacitor voltage at t = 0"},
                ],
            },
            {
                "expression": "t_63% = τ,   t_99% ≈ 5τ",
                "variables": [
                    {"symbol": "t_63%", "name": "Time to reach 63.2% of the final value"},
                ],
            },
        ],
        "variables": [
            {"symbol": "τ", "name": "Time constant", "unit": "second (s)", "description": "R × C; the circuit's intrinsic speed"},
            {"symbol": "V_C(t)", "name": "Capacitor voltage", "unit": "volt (V)", "description": "Exponential function of time during transients"},
            {"symbol": "C", "name": "Capacitance", "unit": "farad (F)", "description": "Charge stored per volt; 1 µF = 10⁻⁶ F"},
            {"symbol": "I_C", "name": "Capacitor current", "unit": "ampere (A)", "description": "C × dV/dt — largest at t = 0, zero at rest"},
        ],
        "components": [
            {"name": "DC voltage source", "quantity": 1, "spec": "9 V fixed"},
            {"name": "Resistor R", "quantity": 1, "spec": "10 kΩ, 1/4 W (gives τ = 1 s with 100 µF)"},
            {"name": "Capacitor C", "quantity": 1, "spec": "100 µF electrolytic, 16 V — mind its polarity"},
            {"name": "SPDT switch (or jumper)", "quantity": 1, "spec": "Selects charge vs discharge path"},
            {"name": "Digital multimeter", "quantity": 1, "spec": "Voltmeter, ideally with stopwatch"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "         +----[R]----+----+\n"
                "         |           |    |\n"
                "      (switch)      === C |\n"
                "         |           |    |\n"
                "       +---+         |    |\n"
                "       | V |         +----+\n"
                "       |src|              |\n"
                "       +---+--------------+"
            ),
            "caption": (
                "With the switch up, the source charges C through R; with the "
                "switch down, C discharges through R. τ = RC is the same either way."
            ),
        },
        "procedure": [
            "Discharge the capacitor fully before starting: short its leads through the 10 kΩ resistor for at least 30 s.",
            "Build the series chain: source → switch → R → C, with C's negative leg to ground.",
            "Calculate τ = 10 kΩ × 100 µF = 1 s before switching anything on.",
            "Flip to charge and start a stopwatch simultaneously; record V_C at t = 1, 2, 3, 4, 5 s.",
            "Continue recording until V_C plateaus near 9 V.",
            "Flip to discharge and record V_C at the same time points until it falls below 0.5 V.",
            "Plot both curves; find the times where charging passes 5.7 V (63.2%) and discharge passes 3.3 V (36.8%).",
            "Compare the measured τ from both curves with the calculated value, allowing for electrolytic tolerance (±20%).",
        ],
        "expected_results": [
            "Charging: V_C ≈ 5.7 V at t = 1 s, ≈ 8.6 V at 3 s, and within 1% of 9 V by 5 s.",
            "Discharging: V_C ≈ 3.3 V at t = 1 s and below 0.1 V by 5 s.",
            "Both curves are exponentials — a plot of ln(V_C) vs t for discharge is a straight line.",
            "Measured τ lands within ±20–30% of 1 s because of electrolytic capacitance tolerance.",
        ],
        "common_mistakes": [
            {
                "mistake": "Installing the electrolytic capacitor backwards",
                "consequence": "The capacitor vents or bursts — it can pop loudly and leak electrolyte.",
            },
            {
                "mistake": "Starting the stopwatch after flipping the switch",
                "consequence": "The early fast-moving part of the curve (where τ lives) is missed.",
            },
            {
                "mistake": "Using a tiny R with a big C (e.g. 100 Ω with 1000 µF)",
                "consequence": "τ = 0.1 s — far too fast to record by hand, and the source sees a near-short at t = 0.",
            },
            {
                "mistake": "Leaving the meter on the junction adds its own discharge path",
                "consequence": "Very high-value resistors make the 10 MΩ meter visibly distort the discharge.",
            },
        ],
        "safety_precautions": [
            "Always respect electrolytic capacitor polarity — reversed units can rupture.",
            "Discharge capacitors through a resistor before handling, never by direct shorting with a wire or screwdriver.",
            "Never charge a capacitor above its voltage rating (16 V part, 9 V source — fine here).",
            "Wear eye protection when experimenting with electrolytics for the first time.",
        ],
        "observation_guidance": [
            "Watch the voltmeter's first-second sprint — the fastest change happens immediately at switch-on.",
            "Notice how the discharge of a charged capacitor can bite even after the source is removed.",
            "Double R and watch the whole curve stretch uniformly in time.",
            "Swap the meter to current briefly at switch-on: the spike then decay mirrors the voltage curve inverted.",
        ],
        "real_world_applications": [
            "Timer chips (555 astable/monostable) set their periods with an RC pair.",
            "Power-rail soft-start and inrush limiting rely on RC ramps.",
            "Low-pass filters smooth PWM into DC in motor drivers and LED dimmers.",
            "Camera flashes store energy in a capacitor and dump it through a lamp.",
        ],
        "related_experiments": ["ohms-law", "series-circuit", "led-circuit"],
        "simulation_configuration": {"mode": "series", "parameters": {"voltage": 9, "r1": 10000}},
    },
    {
        "id": "diode-characteristics",
        "title": "Diode Characteristics",
        "slug": "diode-characteristics",
        "short_description": "Explore the characteristics of a semiconductor diode.",
        "description": (
            "This experiment investigates the I-V characteristics of a "
            "semiconductor diode — the simplest nonlinear component. You will "
            "trace the forward curve past the knee, probe the reverse blocking "
            "region, and see why diodes are the one-way valves of electronics."
        ),
        "objective": (
            "Understand forward and reverse bias behaviour of a diode and "
            "measure its I-V characteristic curve."
        ),
        "theory": (
            "A diode is a PN junction: it conducts readily when forward biased "
            "(anode positive) and blocks when reverse biased. The Shockley "
            "equation I = I_s(e^(V/nV_T) − 1) describes the curve: below about "
            "0.5 V (silicon) almost nothing flows; between 0.6–0.7 V the "
            "exponential turns on hard, and beyond that the diode behaves like "
            "a ~0.7 V battery in series with a small resistance — its voltage "
            "stays nearly constant while current spans decades. In reverse, "
            "only a nanoamp-scale leakage (I_s) flows until breakdown. Because "
            "current is exponential in voltage, the diode is distinctly NOT "
            "ohmic — the resistor's straight-line V-I plot becomes a sharp "
            "corner. This nonlinearity is precisely what makes rectification, "
            "clamping, and logic possible."
        ),
        "difficulty": "Advanced",
        "category": "Semiconductors",
        "duration_minutes": 45,
        "status": "published",
        "historical_background": (
            "Crystal detectors — a galena crystal touched by a 'cat's whisker' "
            "wire — let early radio enthusiasts demodulate signals in the 1900s "
            "without knowing why. The physics arrived in 1938/1939 when Walter "
            "Schottky explained the barrier effect, and in 1949 William "
            "Shockley's junction theory put the PN diode on firm ground as part "
            "of the transistor work at Bell Labs. The 1N4148 you will use "
            "descends from the 1N-series standardisation of the 1960s and is "
            "still among the most-shipped semiconductors on earth."
        ),
        "learning_outcomes": [
            "Identify the forward knee voltage (~0.7 V for silicon) from measured data",
            "Explain the diode's one-way behaviour using the PN junction model",
            "Plot and interpret a nonlinear I-V characteristic",
            "Predict diode current behaviour with the series-resistor method",
        ],
        "prerequisites": ["ohms-law"],
        "formulas": [
            {
                "expression": "I = Iₛ × (e^(V / nV_T) − 1)",
                "variables": [
                    {"symbol": "I", "name": "Diode current"},
                    {"symbol": "Iₛ", "name": "Reverse saturation (leakage) current"},
                    {"symbol": "V", "name": "Voltage across the diode"},
                    {"symbol": "n", "name": "Ideality factor (1–2)"},
                    {"symbol": "V_T", "name": "Thermal voltage ≈ 26 mV at room temperature"},
                ],
            },
            {
                "expression": "V_R = V_supply − V_D",
                "variables": [
                    {"symbol": "V_R", "name": "Voltage across the series resistor"},
                    {"symbol": "V_D", "name": "Diode forward voltage (~0.7 V)"},
                ],
            },
            {
                "expression": "I = V_R / R   (series resistor method)",
                "variables": [
                    {"symbol": "I", "name": "Diode current, measured indirectly"},
                ],
            },
        ],
        "variables": [
            {"symbol": "V_D", "name": "Diode voltage", "unit": "volt (V)", "description": "Forward drop, ~0.6–0.7 V for silicon when conducting"},
            {"symbol": "I_D", "name": "Diode current", "unit": "ampere (A)", "description": "Exponential in V_D above the knee"},
            {"symbol": "V_T", "name": "Thermal voltage", "unit": "volt (V)", "description": "kT/q ≈ 26 mV at 300 K — sets the exponential's scale"},
            {"symbol": "Iₛ", "name": "Saturation current", "unit": "ampere (A)", "description": "Reverse leakage, typically nA for small-signal diodes"},
        ],
        "components": [
            {"name": "Silicon switching diode", "quantity": 1, "spec": "1N4148 (or 1N4001)"},
            {"name": "Series resistor R", "quantity": 1, "spec": "1 kΩ, 1/4 W — limits and senses current"},
            {"name": "Adjustable DC voltage source", "quantity": 1, "spec": "0–12 V, or a fixed supply with a potentiometer"},
            {"name": "Digital multimeter", "quantity": 2, "spec": "Voltmeter (diode) + ammeter (loop)"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "  +----[R]----+>|----+\n"
                "  |      1kΩ   D     |\n"
                " +--+                |\n"
                " | V |   D = 1N4148  |\n"
                " |src|   arrow = anode|\n"
                " +--+                |\n"
                "  |                 |\n"
                "  +-----------------+"
            ),
            "caption": (
                "Forward test: the series resistor drops V_supply − V_D and "
                "sets the current. Flip the diode to test reverse bias."
            ),
        },
        "procedure": [
            "Build the chain: source → 1 kΩ resistor → diode (anode toward the resistor) → back to source.",
            "Start at 0 V and increase in 0.1 V steps of supply; record the diode voltage V_D and current I each step.",
            "Pay attention in the 0.5–0.9 V region: record V_D directly across the diode.",
            "Continue until the diode current reaches 10 mA (V_supply ≈ 10.7 V); never exceed the 1N4148's ratings.",
            "Plot I (mA) vs V_D (V) — the forward characteristic.",
            "Reverse the diode in the circuit and repeat with increasing supply voltage.",
            "Record the reverse current at several voltages up to the supply maximum.",
            "Compare your curve's knee with the datasheet typical 0.7 V at 5 mA.",
        ],
        "expected_results": [
            "Below ~0.5 V forward bias, current stays in the microamp region.",
            "Between 0.6 and 0.75 V, current rises exponentially to milliamps.",
            "V_D stays within roughly 0.6–0.8 V even as current spans 0.1–10 mA.",
            "Reverse bias shows only leakage (nanoamps to a few microamps on a DMM).",
        ],
        "common_mistakes": [
            {
                "mistake": "Connecting the diode with no series resistor",
                "consequence": "Once past the knee the diode shorts the supply and is destroyed in milliseconds.",
            },
            {
                "mistake": "Reading current on the wrong meter jack when switching to mA",
                "consequence": "An open circuit or a blown input fuse produces mysterious zeros.",
            },
            {
                "mistake": "Assuming the diode follows Ohm's Law",
                "consequence": "Linear extrapolation wildly mispredicts current — the component is exponential by nature.",
            },
            {
                "mistake": "Exceeding the reverse voltage rating during the reverse test",
                "consequence": "The diode avalanches and may fail shorted.",
            },
        ],
        "safety_precautions": [
            "Always keep the 1 kΩ series resistor in circuit — it is your current limiter.",
            "Stay within the 1N4148 ratings: 75 V reverse, ~200 mA forward, 500 mW.",
            "Diodes can run warm at higher currents — brief tests only.",
            "Double-check polarity before powering on; reverse installation is common.",
        ],
        "observation_guidance": [
            "Watch V_D creep up only ~100 mV while current climbs 100× — the exponential made visible.",
            "Try the meter's diode-test mode and compare its reading (~0.6–0.7 V) with your curve.",
            "Warm the diode gently between fingers and watch the knee voltage drift down a few millivolts.",
            "In reverse, note how the current barely moves as you crank the voltage — blocking in action.",
        ],
        "real_world_applications": [
            "Rectifiers in every DC power supply turn AC into DC with four diodes (bridge).",
            "Flyback diodes protect switches and relays from inductive voltage spikes.",
            "Diode-OR logic selects between two supplies (battery vs USB) without back-feeding.",
            "RF detectors and mixers exploit the exponential curvature directly.",
        ],
        "related_experiments": ["led-circuit", "ohms-law", "rc-circuit"],
        "simulation_configuration": {"mode": "series", "parameters": {"voltage": 5, "r1": 1000}},
    },
    {
        "id": "led-circuit",
        "title": "LED Circuit",
        "slug": "led-circuit",
        "short_description": "Design and analyze circuits using LEDs.",
        "description": (
            "This experiment explores how to properly use LEDs in circuits. You "
            "will calculate the current-limiting resistor from first principles, "
            "build the circuit, and verify that theory, brightness, and current "
            "all agree — the first 'actuator' circuit every engineer builds."
        ),
        "objective": (
            "Design LED circuits with appropriate current limiting and verify "
            "the operating point by measurement."
        ),
        "theory": (
            "An LED is a diode engineered to convert forward current into "
            "photons, so it inherits diode behaviour: no meaningful conduction "
            "until its forward voltage V_LED is reached (≈1.8–2.2 V for red, "
            "≈3.0–3.4 V for blue/white), then current rises exponentially. "
            "Because of this steep curve, LEDs must be driven with a current-"
            "limited supply, and the cheapest limiter is a series resistor: "
            "R = (V_supply − V_LED) / I_LED. The resistor absorbs the leftover "
            "voltage and sets the current; the LED then self-regulates near "
            "V_LED. Excess supply voltage means more watts in the resistor "
            "than the LED itself — the reason high-power LEDs use switching "
            "drivers instead. Typical indicator LEDs are happy at 5–20 mA."
        ),
        "difficulty": "Advanced",
        "category": "Semiconductors",
        "duration_minutes": 40,
        "status": "published",
        "historical_background": (
            "Electroluminescence was observed in silicon carbide by Henry "
            "Joseph Round (1907) and pursued by Oleg Losev in the 1920s, but "
            "the practical LED arrived in 1962 when Nick Holonyak Jr. "
            "demonstrated the first red visible LED at General Electric. "
            "Blue — the missing primary — took until Shuji Nakamura's "
            "gallium-nitride devices in 1993, which enabled white LEDs and, "
            "eventually, the Nobel Prize in 2014 and the retrofit of the "
            "world's lighting."
        ),
        "learning_outcomes": [
            "Calculate the correct current-limiting resistor for any LED and supply",
            "Understand LED polarity, forward voltage, and current ratings",
            "Measure the circuit's operating point and compare with design targets",
            "Explain why LEDs are current-driven, not voltage-driven, devices",
        ],
        "prerequisites": ["ohms-law"],
        "formulas": [
            {
                "expression": "R = (V_supply − V_LED) / I_LED",
                "variables": [
                    {"symbol": "R", "name": "Current-limiting resistor"},
                    {"symbol": "V_supply", "name": "Supply voltage"},
                    {"symbol": "V_LED", "name": "LED forward voltage (~2 V red, ~3.2 V blue/white)"},
                    {"symbol": "I_LED", "name": "Desired LED current (~20 mA typical)"},
                ],
            },
            {
                "expression": "P_R = (V_supply − V_LED) × I_LED",
                "variables": [
                    {"symbol": "P_R", "name": "Power burned in the resistor (watts)"},
                ],
            },
        ],
        "variables": [
            {"symbol": "V_LED", "name": "LED forward voltage", "unit": "volt (V)", "description": "Colour-dependent: ~1.8–2.2 V red, ~3.0–3.4 V blue/white"},
            {"symbol": "I_LED", "name": "LED current", "unit": "ampere (A)", "description": "The parameter that sets brightness; ~20 mA for indicators"},
            {"symbol": "R", "name": "Limiting resistance", "unit": "ohm (Ω)", "description": "Chooses the operating current for a given supply"},
            {"symbol": "P_R", "name": "Resistor power", "unit": "watt (W)", "description": "(V_supply − V_LED) × I — sizes the resistor's rating"},
        ],
        "components": [
            {"name": "DC voltage source", "quantity": 1, "spec": "5 V fixed (USB-style)"},
            {"name": "LED", "quantity": 2, "spec": "One red (~2 V) and one blue or white (~3.2 V)"},
            {"name": "Resistor R", "quantity": 2, "spec": "Calculated values, e.g. 150 Ω and 100 Ω, 1/4 W"},
            {"name": "Digital multimeter", "quantity": 1, "spec": "Ammeter + voltmeter duty"},
            {"name": "Breadboard", "quantity": 1, "spec": "With jumper wires"},
        ],
        "circuit_diagram": {
            "art": (
                "  +----[R]----+>|----+\n"
                "  |  150Ω      LED    |\n"
                " +--+  (anode to R)   |\n"
                " | V |                 |\n"
                " |src|   LED current → |\n"
                " +--+                 |\n"
                "  |                   |\n"
                "  +-------------------+"
            ),
            "caption": (
                "The resistor goes between supply + and the LED anode; the LED "
                "cathode (flat side / shorter leg) returns to supply −."
            ),
        },
        "procedure": [
            "Identify the LED's anode (longer leg) and cathode (flat side of the rim).",
            "For the red LED (V_LED ≈ 2 V, target 20 mA from 5 V): calculate R = (5 − 2)/0.02 = 150 Ω.",
            "Select the nearest standard resistor (measure its actual value) and build source → R → LED anode → LED cathode → source −.",
            "Power on and confirm the LED lights; note the brightness level.",
            "Measure the voltage across the LED (V_LED) and across the resistor.",
            "Insert the ammeter in series and record the actual current; compare with the 20 mA design target.",
            "Repeat the full design-and-measure cycle for the blue/white LED (V_LED ≈ 3.2 V → R = 90 Ω, use 100 Ω).",
            "BONUS: swap in a 1 kΩ resistor and observe how the LED survives but glows dimly — current, not voltage, sets brightness.",
        ],
        "expected_results": [
            "Red LED: V_LED ≈ 1.8–2.1 V, I ≈ 18–21 mA with the 150 Ω resistor.",
            "Blue/white LED: V_LED ≈ 3.0–3.4 V, I ≈ 16–20 mA with the 100 Ω resistor.",
            "The resistor voltage equals V_supply − V_LED within meter accuracy.",
            "With 1 kΩ the current falls to ~3 mA and the LED dims dramatically but keeps working.",
        ],
        "common_mistakes": [
            {
                "mistake": "Connecting the LED with no resistor at all",
                "consequence": "Current runs away past the knee; the LED dies in a flash — literally, a brief bright pop.",
            },
            {
                "mistake": "Wiring the LED backwards",
                "consequence": "No light, no conduction — reverse-biased diodes block.",
            },
            {
                "mistake": "Using the datasheet V_LED without measuring",
                "consequence": "V_LED varies with colour and current; the actual operating point drifts from the design.",
            },
            {
                "mistake": "Choosing a resistor without checking its power rating",
                "consequence": "At high V gaps the resistor cooks — (5−2 V) × 20 mA = 60 mW is fine here, but scale-ups are not.",
            },
        ],
        "safety_precautions": [
            "Never connect an LED directly across a supply without a series resistor.",
            "Respect LED current limits (~20 mA continuous for standard indicators).",
            "Very bright LEDs can harm eyes stared at point-blank — treat high-power LEDs with respect.",
            "Power off when reorienting the LED.",
        ],
        "observation_guidance": [
            "Compare the two colours at similar current — the higher-V LED runs the resistor cooler.",
            "Watch brightness track current, not supply voltage: change R and observe.",
            "Measure V_LED for both LEDs at the same current and see the colour-dependence of the junction bandgap.",
            "Gently warm the LED and notice V_LED fall ~2 mV/°C — diode physics in action.",
        ],
        "real_world_applications": [
            "Indicator panels, status LEDs, and seven-segment displays everywhere.",
            "Room lighting: LED 'bulbs' are arrays driven by constant-current drivers.",
            "Optocouplers pair an LED with a phototransistor to isolate sensitive circuits.",
            "Infrared LEDs power remote controls and proximity sensors in every phone.",
        ],
        "related_experiments": ["diode-characteristics", "ohms-law", "rc-circuit"],
        "simulation_configuration": {"mode": "series", "parameters": {"voltage": 5, "r1": 150}},
    },
]
