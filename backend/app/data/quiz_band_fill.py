"""Enough extra questions for a 40-question Easy, Medium, or Difficult attempt.

New items use categories the quiz mapper locks to one difficulty:
formulas -> easy, numerical -> medium, troubleshooting -> hard.
They are not relabeled copies of the existing bank.
"""

from __future__ import annotations

import math

LETTERS = ("A", "B", "C", "D")

# Readable titles. Question text always includes the title so labs do not collide.
TITLES = {
    "ohms-law": "Ohm's law",
    "series-circuit": "Series circuit",
    "parallel-circuit": "Parallel circuit",
    "kvl": "KVL",
    "kcl": "KCL",
    "voltage-divider": "Voltage divider",
    "current-divider": "Current divider",
    "rc-circuit": "RC transient",
    "rl-circuit": "RL transient",
    "rlc-circuit": "RLC transient",
    "series-resonance": "Series resonance",
    "half-wave-rectifier": "Half-wave rectifier",
    "full-wave-bridge-rectifier": "Full-wave bridge",
    "diode-characteristics": "Diode characteristics",
    "led-circuit": "LED circuit",
    "wheatstone-bridge": "Wheatstone bridge",
    "potentiometer": "Potentiometer",
    "superposition-theorem": "Superposition",
    "thevenin-theorem": "Thevenin",
    "norton-theorem": "Norton",
    "maximum-power-transfer": "Maximum power transfer",
    "capacitor-charging": "Capacitor charging",
    "rc-low-pass-filter": "RC low-pass filter",
}


def _fmt(value: float) -> str:
    if abs(value - round(value)) < 1e-8:
        return str(int(round(value)))
    return f"{value:.6g}"


def _pack(title: str, stem: str, correct: str, wrongs: list[str], explanation: str, category: str) -> dict:
    question = f"{title} — {stem}"
    clean: list[str] = []
    for item in wrongs:
        if item != correct and item not in clean:
            clean.append(item)
    extra = 2
    while len(clean) < 3:
        filler = f"none of these ({extra})"
        if filler not in clean and filler != correct:
            clean.append(filler)
        extra += 1
    clean = clean[:3]
    slot = sum(ord(ch) for ch in question) % 4
    options = list(clean)
    options.insert(slot, correct)
    if len(set(options)) != 4:
        raise RuntimeError(question)
    return {
        "question": question,
        "option_a": options[0],
        "option_b": options[1],
        "option_c": options[2],
        "option_d": options[3],
        "correct_answer": LETTERS[slot],
        "explanation": explanation,
        "category": category,
    }


def _calc(title: str, stem: str, correct: str, wrongs: list[str], explanation: str, category: str) -> dict:
    return _pack(title, stem, correct, wrongs, explanation, category)


# --- Easy: one distinct fact per prompt. Answers are lab-specific. ---

EASY_SPECS: dict[str, dict[str, str]] = {
    "ohms-law": {
        "relation": "Current equals voltage divided by resistance",
        "unit": "ampere for the loop current",
        "symbol": "I",
        "meter": "an ammeter in series with the resistor",
        "graph": "voltage versus current, a straight line for a fixed resistor",
        "increase": "raise the source voltage and keep resistance fixed",
        "decrease": "raise the resistance and keep voltage fixed",
        "domain": "steady direct current",
        "source": "an ideal DC voltage source",
        "passives": "one resistor",
        "open_effect": "loop current becomes zero",
        "short_effect": "the resistor is bypassed and current is no longer V/R",
        "steady": "current is constant in time",
        "initial": "the same current as in steady state, because nothing stores energy",
        "condition": "voltage and current stay proportional",
        "report": "source voltage, resistance, and current",
        "goal": "relate voltage, current, and resistance",
        "topology": "a single loop",
        "storage": "no energy stored in an ideal resistor",
        "power": "voltage times current",
        "limit": "infinite resistance forces current toward zero",
        "ideal": "a linear resistor and a source with no internal resistance",
        "tracked": "the single loop current",
        "ground": "the return node of the source",
        "instrument": "the ammeter",
        "polarity": "current enters the resistor terminal at the higher potential when the resistor absorbs power",
        "energy": "power multiplied by time",
        "sibling": "the power expressions that follow from V = IR",
        "axis": "voltage and current, not frequency",
        "compare": "the solved current with voltage divided by resistance",
        "failed": "an open resistor, which passes no current",
    },
    "series-circuit": {
        "relation": "Series resistances add, and the same current flows through each",
        "unit": "ampere, the one current shared by the string",
        "symbol": "I, common to every series element",
        "meter": "one ammeter anywhere in the single path",
        "graph": "voltage drops that add up to the source",
        "increase": "reduce the total series resistance",
        "decrease": "add another series resistor",
        "domain": "steady direct current in one path",
        "source": "one DC voltage source feeding the string",
        "passives": "two or more resistors in one path",
        "open_effect": "every element in the string loses its current",
        "short_effect": "that one resistor drops out of the voltage sum",
        "steady": "one constant current",
        "initial": "the same current as steady state",
        "condition": "the sum of the drops equals the source rise",
        "report": "each resistor, the shared current, and each drop",
        "goal": "see why series current is common and voltages add",
        "topology": "one path from source to return",
        "storage": "no storage; the string is resistive",
        "power": "I squared times each resistance, with the same I",
        "limit": "opening any element stops the whole string",
        "ideal": "wires have zero resistance and resistors are linear",
        "tracked": "the single series current",
        "ground": "the source return",
        "instrument": "a series ammeter plus voltmeters across each resistor",
        "polarity": "drops are measured in the direction of the current",
        "energy": "the sum of each resistor's I squared R times time",
        "sibling": "KVL around the series loop",
        "axis": "element identity versus its voltage drop",
        "compare": "the sum of measured drops with the source voltage",
        "failed": "one open resistor darkens or stops the entire string",
    },
    "parallel-circuit": {
        "relation": "Parallel branch currents add, and every branch sees the same voltage",
        "unit": "ampere, split among the branches",
        "symbol": "I of the source, equal to the sum of branch currents",
        "meter": "an ammeter in the branch whose current you want",
        "graph": "branch currents that add to the source current",
        "increase": "add another parallel branch",
        "decrease": "remove a branch or raise a branch resistance",
        "domain": "steady direct current with a common voltage",
        "source": "one DC voltage across the parallel group",
        "passives": "two or more resistors sharing both nodes",
        "open_effect": "only that branch current becomes zero",
        "short_effect": "the source is nearly shorted and other branches are bypassed",
        "steady": "each branch current is constant",
        "initial": "the same currents as steady state",
        "condition": "branch voltages are equal",
        "report": "source voltage, each branch current, and the sum",
        "goal": "separate the shared voltage from the divided current",
        "topology": "several paths between the same two nodes",
        "storage": "no storage in the resistive branches",
        "power": "source voltage times each branch current",
        "limit": "more equal branches lower the equivalent resistance",
        "ideal": "connecting wires drop no voltage",
        "tracked": "each branch current and their sum",
        "ground": "the common return of every branch",
        "instrument": "a voltmeter across the group and an ammeter per branch",
        "polarity": "every branch has the same voltage polarity",
        "energy": "the sum of branch powers times time",
        "sibling": "KCL at the top node",
        "axis": "branch identity versus branch current",
        "compare": "the sum of branch currents with the source current",
        "failed": "one open branch removes only that branch's current",
    },
    "kvl": {
        "relation": "The signed sum of voltages around a closed loop is zero",
        "unit": "volt, summed around the loop",
        "symbol": "v, a signed voltage in the loop",
        "meter": "a voltmeter across each element in the loop",
        "graph": "rises and drops whose signed sum is zero",
        "increase": "this law does not have a single result that you increase; a larger source requires larger drops",
        "decrease": "reducing the source reduces the sum of the drops",
        "domain": "any lumped loop, checked here with DC",
        "source": "the voltage rise in the loop",
        "passives": "the elements that drop voltage in that loop",
        "open_effect": "the loop is no longer the path you summed",
        "short_effect": "that element's drop becomes zero and the other drops change",
        "steady": "the algebraic sum is still zero",
        "initial": "the algebraic sum is still zero",
        "condition": "you walk the loop in one consistent direction",
        "report": "each signed voltage and the residual of the sum",
        "goal": "check that rises and drops balance",
        "topology": "one closed loop",
        "storage": "KVL does not itself store energy",
        "power": "not required to state KVL",
        "limit": "a zero residual means the loop is consistent",
        "ideal": "lumped elements, so the voltage between two nodes is well defined",
        "tracked": "every voltage in the chosen loop",
        "ground": "only a reference; KVL does not require a particular ground",
        "instrument": "voltmeters",
        "polarity": "the sign flips if you reverse the meter or the walk direction",
        "energy": "not the quantity KVL sums",
        "sibling": "Ohm's law, used to turn a current into a drop",
        "axis": "loop element versus signed voltage",
        "compare": "the measured sum with zero",
        "failed": "a nonzero residual, which means a sign or a missing drop",
    },
    "kcl": {
        "relation": "The signed sum of currents at a node is zero",
        "unit": "ampere, summed at the node",
        "symbol": "i, a signed branch current",
        "meter": "an ammeter in each branch connected to the node",
        "graph": "currents entering and leaving one node",
        "increase": "a larger source current must leave through the other branches",
        "decrease": "opening a leaving branch forces the other leaving currents to carry the difference",
        "domain": "lumped nodes, checked here with DC",
        "source": "the current injected into the node",
        "passives": "the branches tied to that node",
        "open_effect": "that branch contributes zero current",
        "short_effect": "a new low-resistance path takes most of the current",
        "steady": "the node sum is zero",
        "initial": "the node sum is zero",
        "condition": "currents into the node are opposite in sign to currents leaving",
        "report": "each branch current and the residual at the node",
        "goal": "check current balance at a node",
        "topology": "several branches meeting at one node",
        "storage": "KCL does not itself store charge at an ideal node",
        "power": "not required to state KCL",
        "limit": "a zero residual means the node is consistent",
        "ideal": "the node is a single point with no charge accumulation",
        "tracked": "every current touching the node",
        "ground": "a node like any other if you write KCL there",
        "instrument": "ammeters",
        "polarity": "a reversed meter flips that term's sign",
        "energy": "not the quantity KCL sums",
        "sibling": "the current divider, which is KCL plus Ohm's law",
        "axis": "branch identity versus signed current",
        "compare": "the measured sum with zero",
        "failed": "a nonzero residual, which means a missing branch or a bad sign",
    },
    "voltage-divider": {
        "relation": "The tapped voltage is the source times the bottom resistance over the series total",
        "unit": "volt at the output node",
        "symbol": "Vout",
        "meter": "a voltmeter from the tap to the bottom of the divider",
        "graph": "output voltage versus the resistance ratio",
        "increase": "increase the bottom resistance relative to the top",
        "decrease": "increase the top resistance relative to the bottom",
        "domain": "DC resistive division",
        "source": "a DC voltage across the two series resistors",
        "passives": "two series resistors",
        "open_effect": "the tap floats and the divider equation no longer applies",
        "short_effect": "the output is pulled to the shorted node",
        "steady": "a constant fraction of the source",
        "initial": "the same fraction, with no storage",
        "condition": "the load on the tap is light compared with the divider",
        "report": "Vin, both resistors, and Vout",
        "goal": "predict a fraction of a voltage",
        "topology": "two resistors in series, output at the junction",
        "storage": "none",
        "power": "the source voltage times the series current",
        "limit": "equal resistors give half the source",
        "ideal": "no load current leaves the tap",
        "tracked": "the voltage at the junction",
        "ground": "the bottom of the divider",
        "instrument": "a voltmeter at the tap",
        "polarity": "the tap is positive with respect to the grounded bottom when the source is",
        "energy": "not stored; both resistors dissipate",
        "sibling": "the series-circuit current that sets both drops",
        "axis": "resistance ratio versus output voltage",
        "compare": "measured Vout with Vin times R2 over R1 plus R2",
        "failed": "a heavy load that pulls Vout below the unloaded prediction",
    },
    "current-divider": {
        "relation": "A branch takes the share of current set by the other resistor over the sum",
        "unit": "ampere in the selected branch",
        "symbol": "I1 for the branch through R1",
        "meter": "an ammeter in the branch being predicted",
        "graph": "branch current versus the resistance ratio",
        "increase": "lower that branch's resistance relative to the other",
        "decrease": "raise that branch's resistance",
        "domain": "DC current division",
        "source": "a current into two parallel resistors",
        "passives": "two parallel resistors",
        "open_effect": "the remaining branch takes all of the source current",
        "short_effect": "the shorted branch takes essentially all of the current",
        "steady": "constant branch currents",
        "initial": "the same split, with no storage",
        "condition": "both branches see the same voltage",
        "report": "source current, both resistors, and each branch current",
        "goal": "predict how a current splits",
        "topology": "two resistors in parallel fed by one current",
        "storage": "none",
        "power": "branch voltage times branch current",
        "limit": "equal resistors split the current in half",
        "ideal": "the source is an ideal current source",
        "tracked": "the current in one branch",
        "ground": "the common return of the two branches",
        "instrument": "an ammeter in each branch",
        "polarity": "both branch currents leave the input node",
        "energy": "dissipated in the two resistors",
        "sibling": "KCL, because the branch currents must add to the source",
        "axis": "resistance ratio versus branch current",
        "compare": "measured branch current with It times the other R over the sum",
        "failed": "an open branch, which dumps the entire current into the other resistor",
    },
    "rc-circuit": {
        "relation": "The time constant is R times C, and capacitor voltage approaches the source exponentially",
        "unit": "second for tau, and volt for capacitor voltage",
        "symbol": "tau = RC",
        "meter": "a voltmeter across the capacitor",
        "graph": "capacitor voltage versus time",
        "increase": "increase R or C to slow the transient",
        "decrease": "decrease R or C to speed the transient",
        "domain": "a DC step and a time-domain transient",
        "source": "a DC step through a resistor",
        "passives": "one resistor and one capacitor in series",
        "open_effect": "the capacitor stops charging or discharging",
        "short_effect": "the capacitor voltage is clamped",
        "steady": "capacitor current is zero and its voltage matches the applied DC",
        "initial": "an uncharged capacitor holds zero volts and takes all the voltage change",
        "condition": "one time constant brings the voltage about 63 percent of the way",
        "report": "R, C, Vin, tau, and the voltage curve",
        "goal": "connect RC to the speed of the transient",
        "topology": "series R then C, with the capacitor returned to the source",
        "storage": "electric energy in the capacitor",
        "power": "resistor heating plus the rate of change of stored energy",
        "limit": "after many time constants the capacitor looks like an open circuit",
        "ideal": "a linear capacitor and a step source",
        "tracked": "capacitor voltage versus time",
        "ground": "the source and capacitor return",
        "instrument": "an oscilloscope or a voltmeter on the capacitor",
        "polarity": "the capacitor charges toward the source polarity",
        "energy": "one half C V squared once it has charged",
        "sibling": "the exponential approach to the final voltage",
        "axis": "time versus capacitor voltage",
        "compare": "simulated tau with R times C",
        "failed": "a flat zero capacitor voltage, which means the charging path is open",
    },
    "rl-circuit": {
        "relation": "The time constant is L divided by R, and inductor current approaches V over R",
        "unit": "second for tau, and ampere for inductor current",
        "symbol": "tau = L/R",
        "meter": "an ammeter in series with the inductor",
        "graph": "inductor current versus time",
        "increase": "increase L or reduce R to slow the current rise",
        "decrease": "reduce L or increase R to speed the current rise",
        "domain": "a DC step and a time-domain transient",
        "source": "a DC step through a resistor and an inductor",
        "passives": "one resistor and one inductor in series",
        "open_effect": "current cannot continue, and the inductor voltage spikes in a real circuit",
        "short_effect": "the resistor is bypassed and the time constant changes",
        "steady": "the inductor voltage is zero and the current is V over R",
        "initial": "inductor current stays at its previous value, zero if it started at rest",
        "condition": "one time constant brings the current about 63 percent of the way",
        "report": "R, L, Vin, tau, and the current curve",
        "goal": "connect L/R to the speed of the current rise",
        "topology": "series R and L",
        "storage": "magnetic energy in the inductor",
        "power": "resistor heating plus the rate of change of stored energy",
        "limit": "after many time constants the inductor looks like a short",
        "ideal": "a linear inductor and a step source",
        "tracked": "inductor current versus time",
        "ground": "the source return",
        "instrument": "an ammeter in the series path and a voltmeter across the inductor",
        "polarity": "inductor voltage opposes the increase of current",
        "energy": "one half L I squared in steady state",
        "sibling": "the exponential approach of current to V/R",
        "axis": "time versus inductor current",
        "compare": "simulated tau with L divided by R",
        "failed": "a current that jumps instantly, which means the inductor is not in the path",
    },
    "rlc-circuit": {
        "relation": "A series RLC step rings when R is below 2 times the square root of L over C",
        "unit": "volt and ampere versus time, plus the damping set by R, L, and C",
        "symbol": "the natural response of a second-order loop",
        "meter": "a voltmeter on the capacitor and an ammeter in the loop",
        "graph": "a ringing or exponential waveform versus time",
        "increase": "lower R to make the ring last longer",
        "decrease": "raise R to damp the ring",
        "domain": "a second-order transient",
        "source": "a DC step into series R, L, and C",
        "passives": "one resistor, one inductor, and one capacitor",
        "open_effect": "the loop current stops and the stored energy has nowhere to go in the model",
        "short_effect": "that element drops out of the characteristic equation",
        "steady": "capacitor voltage settles at the DC source and inductor current returns to zero if the capacitor blocks DC",
        "initial": "capacitor voltage and inductor current are continuous",
        "condition": "underdamped when R is less than 2 times the square root of L over C",
        "report": "R, L, C, and the voltage or current waveform",
        "goal": "tell a damped exponential from a ring",
        "topology": "series R, L, and C",
        "storage": "energy trades between the inductor and the capacitor",
        "power": "only the resistor dissipates; L and C store",
        "limit": "very large R removes the oscillation",
        "ideal": "linear L and C and a step source",
        "tracked": "capacitor voltage or loop current versus time",
        "ground": "the source return",
        "instrument": "an oscilloscope on the capacitor",
        "polarity": "the capacitor voltage swings through both signs when the loop rings",
        "energy": "one half L i squared plus one half C v squared",
        "sibling": "the series resonant frequency, which sets the ring rate when damping is light",
        "axis": "time versus the ringing waveform",
        "compare": "the observed damping with the R, L, and C boundary",
        "failed": "a growing sine, which a passive R cannot produce",
    },
    "series-resonance": {
        "relation": "Current peaks when the inductive and capacitive reactances cancel",
        "unit": "hertz for the resonant frequency, and ampere for the peak current",
        "symbol": "f0 = 1 over 2 pi square root of L C",
        "meter": "an ammeter in the series RLC loop",
        "graph": "current versus frequency, with a peak at resonance",
        "increase": "lower L or C to raise the resonant frequency",
        "decrease": "raise L or C to lower the resonant frequency",
        "domain": "a sinusoidal frequency sweep",
        "source": "a sine source swept in frequency",
        "passives": "series R, L, and C",
        "open_effect": "loop current is zero at every frequency",
        "short_effect": "removing L or C destroys the cancellation that defines resonance",
        "steady": "each frequency is a phasor solution, not a DC point",
        "initial": "not a step response; the sweep assumes steady sine excitation",
        "condition": "XL equals XC, the impedance equals R, and current is Vin over R",
        "report": "R, L, C, theoretical f0, simulated f0, and the current curve",
        "goal": "find the frequency where series current is largest",
        "topology": "one series loop of R, L, and C",
        "storage": "L and C exchange energy; the source only supplies the resistor loss",
        "power": "at resonance the average power is I squared R",
        "limit": "a larger R lowers and widens the current peak",
        "ideal": "a sine source and linear L and C",
        "tracked": "loop current versus frequency",
        "ground": "the source return",
        "instrument": "the frequency sweep and a series current measurement",
        "polarity": "the source phase is the reference for the phasor current",
        "energy": "stored energy oscillates between L and C at resonance",
        "sibling": "Q and bandwidth, which describe the sharpness of the peak",
        "axis": "frequency versus loop current",
        "compare": "the frequency of peak current with 1 over 2 pi square root of L C",
        "failed": "a flat current curve, which means Q is too low or the parts are not the ones in the formula",
    },
    "half-wave-rectifier": {
        "relation": "One diode conducts on one half-cycle, so the load sees a single pulse per cycle",
        "unit": "volt for the rectified peak, and hertz for ripple equal to the source frequency",
        "symbol": "Vout peak about Vin peak minus the diode drop",
        "meter": "a scope on the source and on the load",
        "graph": "input sine and a one-pulse-per-cycle output",
        "increase": "a larger source peak raises the output peak",
        "decrease": "a larger diode drop lowers the output peak",
        "domain": "time-domain rectification of a sine",
        "source": "a sine voltage",
        "passives": "one diode and a load resistor",
        "open_effect": "the load voltage stays at zero",
        "short_effect": "a shorted diode puts the AC source on the load for both half-cycles",
        "steady": "a repeating pulse train, not a DC level, unless a filter is added",
        "initial": "conduction starts when the source exceeds the diode drop",
        "condition": "ripple frequency equals the AC source frequency",
        "report": "Vin peak, Vout peak, average, diode drop, and ripple frequency",
        "goal": "see one-polarity pulses at the source frequency",
        "topology": "diode in series with the load",
        "storage": "none in the basic unfiltered rectifier",
        "power": "delivered to the load only while the diode conducts",
        "limit": "if the source peak is below the diode drop, the output pulses disappear",
        "ideal": "a fixed forward drop and an ideal reverse block",
        "tracked": "load voltage versus time",
        "ground": "the source and load return",
        "instrument": "an oscilloscope with the source and the load",
        "polarity": "reversing the diode reverses which half-cycle reaches the load",
        "energy": "the average of instantaneous load power over a cycle",
        "sibling": "the average of a half-wave pulse, Vin peak over pi when the drop is neglected",
        "axis": "time versus input and output voltage",
        "compare": "output peak with input peak minus the diode drop",
        "failed": "output pulses on both half-cycles, which means the diode is shorted or bypassed",
    },
    "full-wave-bridge-rectifier": {
        "relation": "A diode bridge uses both half-cycles, and the load ripple is twice the source frequency",
        "unit": "volt for the rectified peak, and hertz for ripple at twice the source frequency",
        "symbol": "Vout peak about Vin peak minus two diode drops",
        "meter": "a scope on the AC source and on the load",
        "graph": "input sine and a two-pulse-per-cycle output",
        "increase": "a larger AC peak raises both output pulses",
        "decrease": "each conducting pair costs about two diode drops",
        "domain": "time-domain bridge rectification",
        "source": "a floating sine between the AC corners of the bridge",
        "passives": "four diodes and a load resistor",
        "open_effect": "a missing diode removes one of the two pulses",
        "short_effect": "a shorted diode can short the source on one half-cycle",
        "steady": "two identical pulses each cycle when all four diodes work",
        "initial": "conduction starts when the AC peak exceeds two diode drops",
        "condition": "two diodes conduct together on each half-cycle",
        "report": "Vin peak, Vout peak, average, and ripple frequency",
        "goal": "use both half-cycles and double the ripple rate",
        "topology": "four diodes in a bridge with the load across the DC corners",
        "storage": "none until a filter capacitor is added",
        "power": "delivered on both half-cycles",
        "limit": "a source peak below two diode drops produces little or no output",
        "ideal": "each diode has the same forward drop",
        "tracked": "load voltage and which diode pair is conducting",
        "ground": "the load return, not both AC terminals",
        "instrument": "an oscilloscope on input and output",
        "polarity": "the load polarity stays the same on both half-cycles",
        "energy": "higher average load energy than a half-wave rectifier at the same peak",
        "sibling": "the full-wave average, twice the half-wave average when drops match the model",
        "axis": "time versus input and rectified output",
        "compare": "ripple frequency with twice the source frequency",
        "failed": "only one pulse per cycle, which means a diode path is open",
    },
    "diode-characteristics": {
        "relation": "A diode conducts in one direction after a forward knee and blocks in reverse",
        "unit": "volt across the diode and ampere through it",
        "symbol": "Vf for the forward drop",
        "meter": "a voltmeter across the diode and an ammeter in series",
        "graph": "forward current versus forward voltage, with a knee",
        "increase": "more forward voltage past the knee raises current sharply",
        "decrease": "reverse bias keeps current near zero in this model",
        "domain": "the DC V–I curve of one diode",
        "source": "a variable DC source in series with a limiting resistor",
        "passives": "one diode and a series resistor",
        "open_effect": "no current at any voltage",
        "short_effect": "the curve becomes the resistor line, with no knee",
        "steady": "a DC operating point on the curve",
        "initial": "the same point; this lab is not a transient",
        "condition": "forward current is large only above the knee",
        "report": "source, series R, diode voltage, and diode current",
        "goal": "read a nonlinear V–I curve",
        "topology": "source, resistor, and diode in one loop",
        "storage": "none in the basic diode model used here",
        "power": "diode voltage times diode current, plus resistor heating",
        "limit": "below the knee the current is much smaller than V/R",
        "ideal": "a fixed knee or a simple forward drop, not a full SPICE model",
        "tracked": "diode voltage and current",
        "ground": "the source return",
        "instrument": "voltmeter and ammeter, or the solved V–I points",
        "polarity": "reverse connection yields essentially no current",
        "energy": "not stored; the diode dissipates while it conducts",
        "sibling": "Ohm's law on the series resistor, which sets the current once the drop is known",
        "axis": "diode voltage versus diode current",
        "compare": "the solved forward drop with the model knee",
        "failed": "a straight line through the origin, which means the diode is shorted",
    },
    "led-circuit": {
        "relation": "A series resistor sets LED current from the source minus the LED forward drop",
        "unit": "ampere through the LED, set by the series resistor",
        "symbol": "I = (Vs - Vf) / R",
        "meter": "an ammeter in series with the LED",
        "graph": "LED current versus series resistance",
        "increase": "lower the series resistor or raise the source, within the LED rating",
        "decrease": "raise the series resistor",
        "domain": "DC bias of an LED",
        "source": "a DC supply above the LED forward drop",
        "passives": "one LED and one series resistor",
        "open_effect": "the LED is dark and current is zero",
        "short_effect": "shorting the resistor removes the current limit",
        "steady": "a constant forward current",
        "initial": "the same DC current; an LED is not a timing element here",
        "condition": "the source must exceed the LED forward drop",
        "report": "Vs, Vf, R, and LED current",
        "goal": "choose a resistor that sets a safe LED current",
        "topology": "source, resistor, and LED in one loop",
        "storage": "none",
        "power": "LED drop times current, plus resistor heating",
        "limit": "if Vs is below Vf the LED stays off",
        "ideal": "a fixed LED forward drop",
        "tracked": "LED current",
        "ground": "the source return",
        "instrument": "an ammeter in the LED path",
        "polarity": "the LED conducts only when its anode is toward the positive source",
        "energy": "dissipated as light and heat, not stored",
        "sibling": "Ohm's law on the resistor after subtracting Vf",
        "axis": "series resistance versus LED current",
        "compare": "solved current with (Vs - Vf) / R",
        "failed": "no light with a correct resistor, which usually means the LED is reversed or open",
    },
    "wheatstone-bridge": {
        "relation": "The detector voltage is zero when the two divider ratios are equal",
        "unit": "volt at the detector, zero at balance",
        "symbol": "Vdetector",
        "meter": "a voltmeter between the two divider midpoints",
        "graph": "detector voltage versus the adjusted resistor",
        "increase": "unbalance the ratios to raise the detector voltage",
        "decrease": "move the adjusted resistor toward the balance ratio",
        "domain": "DC bridge balance",
        "source": "a DC source across the bridge",
        "passives": "four resistors, one of them often the unknown",
        "open_effect": "a detector or an arm that is open is not a balance reading",
        "short_effect": "a shorted arm collapses that divider",
        "steady": "a constant detector voltage",
        "initial": "the same DC reading",
        "condition": "R1/R2 = R3/R4 at balance, with the detector near zero",
        "report": "the four resistances and the detector voltage",
        "goal": "find balance from a null, not from a large deflection",
        "topology": "two voltage dividers side by side",
        "storage": "none",
        "power": "dissipated in the arms; the detector current is zero at balance",
        "limit": "a perfect balance nulls the detector",
        "ideal": "a detector that draws no current at the null",
        "tracked": "the voltage between the midpoints",
        "ground": "the bottom of both dividers",
        "instrument": "a voltmeter used as the detector",
        "polarity": "the detector sign shows which way the bridge is unbalanced",
        "energy": "not the measurement; the null is a voltage",
        "sibling": "the voltage divider equation on each arm",
        "axis": "adjusted resistance versus detector voltage",
        "compare": "a near-zero detector with the ratio condition",
        "failed": "a large detector voltage when the written ratios already match, which means the wired values differ",
    },
    "potentiometer": {
        "relation": "Wiper voltage is the fraction of the input set by the wiper position",
        "unit": "volt at the wiper",
        "symbol": "Vout",
        "meter": "a voltmeter from the wiper to the grounded end",
        "graph": "output voltage versus wiper position",
        "increase": "move the wiper toward the source end",
        "decrease": "move the wiper toward the grounded end",
        "domain": "DC division with a movable tap",
        "source": "a DC voltage across the element",
        "passives": "one potentiometer",
        "open_effect": "an open element leaves the wiper undefined",
        "short_effect": "a shorted end forces the wiper span to change",
        "steady": "a constant voltage set by position",
        "initial": "the same voltage; there is no transient in the ideal model",
        "condition": "the bottom end is the reference and the wiper is the output",
        "report": "input voltage, wiper fraction, and output voltage",
        "goal": "treat the potentiometer as a variable divider",
        "topology": "a three-terminal divider",
        "storage": "none",
        "power": "input voltage times the element current",
        "limit": "the grounded end is near zero and the top end is near the input",
        "ideal": "a light load on the wiper",
        "tracked": "wiper voltage",
        "ground": "the bottom terminal",
        "instrument": "a voltmeter on the wiper",
        "polarity": "output has the sign of the input relative to the grounded end",
        "energy": "dissipated in the element",
        "sibling": "the two-resistor voltage divider",
        "axis": "wiper position versus output voltage",
        "compare": "measured wiper voltage with input times the position fraction",
        "failed": "an output that ignores the shaft, which means the meter is on a fixed end",
    },
    "superposition-theorem": {
        "relation": "Each independent source acts alone, and the voltages or currents add",
        "unit": "volt or ampere of the summed response",
        "symbol": "v = v1 + v2",
        "meter": "the same voltmeter or ammeter for the full run and each single-source run",
        "graph": "the full response, each contribution, and their sum",
        "increase": "scaling every independent source by k scales a linear response by k",
        "decrease": "turning one source off removes only its contribution",
        "domain": "linear DC networks with more than one independent source",
        "source": "two or more independent sources",
        "passives": "linear resistors",
        "open_effect": "that is how an independent current source is removed",
        "short_effect": "that is how an independent voltage source is removed",
        "steady": "a DC solution for each source state",
        "initial": "the same DC solutions",
        "condition": "voltage sources are replaced by shorts and current sources by opens when inactive",
        "report": "each single-source result, the sum, and the all-sources result",
        "goal": "add contributions instead of solving the whole network at once",
        "topology": "a linear network with two independent sources",
        "storage": "none in the resistive form of the theorem",
        "power": "must not be superimposed; power is not linear",
        "limit": "if every source is inactive, a resistive response is zero",
        "ideal": "linear elements and independent sources",
        "tracked": "one voltage or current through every source state",
        "ground": "the same reference in every partial circuit",
        "instrument": "one meter left on the same element for every run",
        "polarity": "contributions keep their algebraic sign",
        "energy": "not added source by source",
        "sibling": "linearity, which is why the pieces add",
        "axis": "source state versus the chosen response",
        "compare": "the all-sources run with the sum of the single-source runs",
        "failed": "a sum that misses the combined run, often because a source was not fully deactivated",
    },
    "thevenin-theorem": {
        "relation": "A linear port becomes Vth in series with Rth",
        "unit": "volt for Vth and ohm for Rth",
        "symbol": "Vth and Rth",
        "meter": "a voltmeter on the open port, then the load voltage and current",
        "graph": "original load response versus the Thevenin equivalent",
        "increase": "a larger Vth raises load current for the same resistances",
        "decrease": "a larger Rth or RL lowers load current",
        "domain": "DC linear equivalents",
        "source": "the independent sources inside the network being replaced",
        "passives": "the linear resistors that set Rth",
        "open_effect": "the open port is exactly how Vth is measured",
        "short_effect": "the short-circuit current is Vth over Rth",
        "steady": "Vth and Rth do not depend on the external load",
        "initial": "the same DC equivalent",
        "condition": "independent voltage sources are shorted and current sources opened when finding Rth",
        "report": "Vth, Rth, RL, load voltage, and load current",
        "goal": "replace the network with a series source and resistance",
        "topology": "a port with the load removed, then reattached",
        "storage": "none in the resistive theorem",
        "power": "load power is I squared RL after IL = Vth / (Rth + RL)",
        "limit": "with RL removed, the port voltage is Vth",
        "ideal": "a linear network at the port",
        "tracked": "load voltage and current",
        "ground": "the reference used on both the original and the equivalent",
        "instrument": "a voltmeter for Voc and the load",
        "polarity": "Vth has the open-circuit polarity of the port",
        "energy": "not stored",
        "sibling": "Norton, related by Vth = In times Rn",
        "axis": "load resistance versus load voltage or current",
        "compare": "original load current with Vth over Rth plus RL",
        "failed": "an Rth measured with the load still attached",
    },
    "norton-theorem": {
        "relation": "A linear port becomes In in parallel with Rn",
        "unit": "ampere for In and ohm for Rn",
        "symbol": "In and Rn",
        "meter": "an ammeter that shorts the port for In, then a load voltmeter",
        "graph": "original load response versus the Norton equivalent",
        "increase": "a larger In raises the voltage on the same parallel pair",
        "decrease": "a smaller Rn steals more current from the load",
        "domain": "DC linear equivalents",
        "source": "the independent sources that set In",
        "passives": "the linear resistors that set Rn",
        "open_effect": "opening the port gives Voc = In times Rn",
        "short_effect": "the port short is exactly how In is measured",
        "steady": "In and Rn do not depend on the external load",
        "initial": "the same DC equivalent",
        "condition": "deactivate sources the same way as for Rth, because Rn equals Rth",
        "report": "In, Rn, RL, load voltage, and load current",
        "goal": "replace the network with a parallel source and resistance",
        "topology": "In parallel with Rn, feeding RL",
        "storage": "none in the resistive theorem",
        "power": "load power after the current split between Rn and RL",
        "limit": "a shorted port carries In",
        "ideal": "a linear network at the port",
        "tracked": "load voltage",
        "ground": "the same reference as the original port",
        "instrument": "an ammeter for the port short and a voltmeter on the load",
        "polarity": "the In arrow sets the load-voltage sign",
        "energy": "not stored",
        "sibling": "Thevenin, with Rn = Rth and In = Vth / Rth",
        "axis": "load resistance versus load voltage",
        "compare": "original load voltage with In times the parallel of Rn and RL",
        "failed": "an In measured while the load is still connected",
    },
    "maximum-power-transfer": {
        "relation": "A resistive load takes maximum power when it equals the source resistance",
        "unit": "watt at the load",
        "symbol": "Pmax = Vth squared over 4 Rth",
        "meter": "load voltage and current, or a computed load power",
        "graph": "load power versus load resistance, peaking at Rth",
        "increase": "move RL toward Rth from either side",
        "decrease": "move RL far above or far below Rth",
        "domain": "DC power in a resistive Thevenin port",
        "source": "the Thevenin voltage behind Rth",
        "passives": "Rth and the variable load",
        "open_effect": "infinite RL draws no current, so load power is zero",
        "short_effect": "zero RL has no voltage, so load power is zero",
        "steady": "a DC power for each load setting",
        "initial": "the same DC power",
        "condition": "RL = Rth",
        "report": "Rth, RL, load power, and the peak condition",
        "goal": "find the load that extracts the most power",
        "topology": "Vth, Rth, and RL in series",
        "storage": "none",
        "power": "the quantity being maximized",
        "limit": "efficiency is 50 percent at the maximum-power point",
        "ideal": "a fixed Thevenin source and a variable resistive load",
        "tracked": "load power",
        "ground": "the series-loop return",
        "instrument": "meters that give load voltage and current",
        "polarity": "power uses the product, so the sign of current does not change the peak location",
        "energy": "power times the time the load is connected",
        "sibling": "Thevenin's equivalent, which supplies Vth and Rth",
        "axis": "load resistance versus load power",
        "compare": "the resistance at peak power with Rth",
        "failed": "a peak that is not at Rth, which means Rth was measured with the load included",
    },
    "capacitor-charging": {
        "relation": "Closing the path lets an uncharged capacitor voltage rise from zero toward the source",
        "unit": "volt on the capacitor, with tau = RC in seconds",
        "symbol": "Vc(t)",
        "meter": "a voltmeter or scope across the capacitor",
        "graph": "a rising exponential of capacitor voltage versus time",
        "increase": "a larger source raises the final voltage",
        "decrease": "a larger R or C stretches the same curve over more time",
        "domain": "the charging transient after the switch closes",
        "source": "a DC source applied through a resistor",
        "passives": "a resistor, a capacitor, and a switch",
        "open_effect": "the switch-open state stops the charge or starts a discharge if a path remains",
        "short_effect": "the capacitor voltage cannot rise",
        "steady": "capacitor voltage equals the source and current is zero",
        "initial": "zero volts on an uncharged capacitor and initial current Vin over R",
        "condition": "at one time constant the voltage is about 63 percent of the source",
        "report": "Vin, R, C, tau, and the charging curve",
        "goal": "watch a capacitor charge and check tau",
        "topology": "switch, resistor, and capacitor in series",
        "storage": "one half C Vc squared",
        "power": "resistor heating while current flows",
        "limit": "many time constants bring Vc essentially to Vin",
        "ideal": "the capacitor starts uncharged and the source is a step",
        "tracked": "capacitor voltage during charge",
        "ground": "the capacitor return",
        "instrument": "a scope on the capacitor",
        "polarity": "the capacitor charges to the source polarity",
        "energy": "one half C Vin squared at the end of the charge",
        "sibling": "the RC transient, read here as a charging event",
        "axis": "time versus capacitor voltage",
        "compare": "the time to 63 percent with R times C",
        "failed": "a voltage that jumps to Vin immediately, which means the resistor is bypassed",
    },
    "rc-low-pass-filter": {
        "relation": "Cutoff is 1 over 2 pi R C, and gain falls once the drive is above that frequency",
        "unit": "hertz for cutoff, and a voltage ratio for gain",
        "symbol": "fc",
        "meter": "a scope on the source and on the capacitor",
        "graph": "gain versus frequency, with the cutoff marked",
        "increase": "lower R or C to raise the cutoff",
        "decrease": "raise R or C to lower the cutoff",
        "domain": "sinusoidal steady state and a frequency sweep",
        "source": "a function-generator sine",
        "passives": "a series resistor and a capacitor to ground",
        "open_effect": "the output node is no longer the capacitor voltage",
        "short_effect": "a shorted capacitor kills the output",
        "steady": "a sine whose amplitude and phase depend on frequency",
        "initial": "not the quantity this lab reports; the sweep is a set of phasors",
        "condition": "gain is 1 over square root of 2 at the cutoff",
        "report": "R, C, drive frequency, theoretical fc, simulated fc, gain, and phase",
        "goal": "see a low-pass cutoff on a real sweep",
        "topology": "series R, shunt C",
        "storage": "the capacitor sets the frequency dependence",
        "power": "not the main result; gain and phase are",
        "limit": "far above cutoff the gain keeps falling",
        "ideal": "a sine source and a linear RC",
        "tracked": "output amplitude over input amplitude",
        "ground": "the capacitor return and the source return",
        "instrument": "the function generator and a two-channel oscilloscope",
        "polarity": "the output sine lags the input",
        "energy": "not used to state the cutoff",
        "sibling": "the RC time constant, related by fc = 1 over 2 pi tau",
        "axis": "frequency versus voltage gain",
        "compare": "simulated cutoff with 1 over 2 pi R C",
        "failed": "a gain that stays near 1 far above cutoff, which means the output probe is on the input",
    },
}

EASY_PROMPTS: list[tuple[str, str, list[str]]] = [
    ("Which statement is the defining relation?", "relation", ["Current equals resistance divided by voltage", "Power equals resistance alone", "Frequency equals current times voltage"]),
    ("The main result is expressed in which unit?", "unit", ["henry for a DC loop current", "farad for a resistor drop", "watt for a KCL residual"]),
    ("Which symbol denotes the main result?", "symbol", ["only the font size", "a wire color code", "the email of the operator"]),
    ("How is the main result measured?", "meter", ["a thermometer on the enclosure", "a ruler along the wire", "the quiz timer"]),
    ("Which graph matches the experiment?", "graph", ["a decorative sine with no solved samples", "theme contrast versus time", "a blank chart labeled later"]),
    ("Which change increases the main result?", "increase", ["paint the enclosure", "rename the net", "lower the screen brightness"]),
    ("Which change decreases the main result?", "decrease", ["add a logo", "change the typeface", "dim the grid"]),
    ("Which description matches the domain?", "domain", ["a mechanical gear ratio", "an optical focal length", "a software theme token"]),
    ("Which source does the starter use?", "source", ["no source, by design", "a random noise block", "only a CSS variable"]),
    ("Which passive parts does the starter need?", "passives", ["only a speaker cone", "a lens and a prism", "no parts at all"]),
    ("What does an open in the signal path do?", "open_effect", ["it raises the supply voltage", "it creates a resonant peak by itself", "it stores extra charge in an ideal wire"]),
    ("What does a short across the measured element do?", "short_effect", ["it always improves accuracy", "it sets the time constant to RC", "it balances a bridge"]),
    ("What is expected a long time after a DC step, when that idea applies?", "steady", ["a new resonant frequency", "an automatic quiz score", "a color shift"]),
    ("What is expected at the first instant, when that idea applies?", "initial", ["infinite resistor energy", "a printer setting", "a theme change"]),
    ("Which special condition belongs to this experiment?", "condition", ["the screen must be dark", "the title must be short", "the cursor must blink"]),
    ("Which quantities belong in the lab report?", "report", ["only the theme name", "only the operator email", "only the font size"]),
    ("What is the learning goal?", "goal", ["to restyle the sidebar", "to rename the files", "to change the login color"]),
    ("Which topology does the starter use?", "topology", ["a gear train", "a single pixel", "an empty page"]),
    ("Where is energy stored, if anywhere?", "storage", ["in the ground symbol font", "in the quiz button", "in the page title"]),
    ("How is power obtained?", "power", ["from the window size", "from the icon color", "from the scrollbar"]),
    ("Which limiting case should you remember?", "limit", ["the minimum font size", "the maximum logo width", "the tooltip delay"]),
    ("Which ideal assumption does the model use?", "ideal", ["wires have random resistance each run", "meters change the laws of the circuit", "the solver invents a second source"]),
    ("Which quantity should you track?", "tracked", ["the cursor position", "the notification count", "the theme name"]),
    ("What is ground used for?", "ground", ["to set the font weight", "to store the quiz score", "to color the wires"]),
    ("Which instrument is primary?", "instrument", ["a stopwatch for resistance", "a camera for current", "a microphone for voltage"]),
    ("Why does polarity matter here?", "polarity", ["it changes the page background only", "it selects the font", "it has no electrical effect in any circuit"]),
    ("How is energy obtained when the lab needs it?", "energy", ["from the browser zoom", "from the sidebar width", "from the button radius"]),
    ("Which related law is only a side check?", "sibling", ["the HTML heading level", "the CSS spacing scale", "the router path"]),
    ("Which axes match the experiment?", "axis", ["theme versus opacity", "email versus time", "font versus margin"]),
    ("Theory should be compared with which evidence?", "compare", ["a hand-drawn curve pasted over the plot", "a fixed number from another lab", "the previous user's score"]),
    ("How does a failed part show up?", "failed", ["the title changes color", "the page scrolls", "the logo moves"]),
    ("Which statement is outside the goal even if it sounds technical?", "goal", ["matching a paint swatch", "counting pages", "setting a border radius"]),
]


def _easy_for(experiment_id: str) -> list[dict]:
    spec = EASY_SPECS[experiment_id]
    title = TITLES[experiment_id]
    items = []
    for stem, key, wrongs in EASY_PROMPTS:
        correct = spec[key]
        items.append(
            _pack(
                title,
                stem,
                correct,
                wrongs,
                f"For the {title} experiment, {correct[0].lower() + correct[1:] if correct else correct}.",
                "formulas",
            )
        )
    if len(items) != 32:
        raise RuntimeError(f"{experiment_id} easy {len(items)}")
    return items


def _wrongs(correct: str, *candidates: str) -> list[str]:
    clean: list[str] = []
    extras = [f"twice {correct}", f"half of {correct}", f"0 instead of {correct}"]
    for item in list(candidates) + extras:
        if item != correct and item not in clean:
            clean.append(item)
        if len(clean) == 3:
            break
    if len(clean) < 3:
        raise RuntimeError(correct)
    return clean


def _medium_resistive(title: str, kind: str) -> list[dict]:
    items: list[dict] = []
    if kind == "ohms":
        pairs = [(12, 4), (9, 3), (15, 5), (18, 6), (24, 8), (10, 2), (20, 5), (30, 6)]
        for volts, ohms in pairs:
            current = volts / ohms
            power = volts * current
            items.append(_calc(title, f"A { _fmt(volts) } V source feeds { _fmt(ohms) } ohm. The current is", f"{_fmt(current)} A", _wrongs(f"{_fmt(current)} A", f"{_fmt(volts * ohms)} A", f"{_fmt(ohms / volts)} A", f"{_fmt(current + 1)} A"), f"I = V/R = {_fmt(volts)}/{_fmt(ohms)} A.", "numerical"))
            items.append(_calc(title, f"With { _fmt(volts) } V across { _fmt(ohms) } ohm, the resistor power is", f"{_fmt(power)} W", _wrongs(f"{_fmt(power)} W", f"{_fmt(volts * ohms)} W", f"{_fmt(current)} W", f"{_fmt(power / 2)} W"), f"P = VI = {_fmt(volts)} × {_fmt(current)} W.", "numerical"))
        given = [(2, 5), (3, 4), (4, 6), (5, 8), (1, 12), (6, 3), (2, 15), (4, 10)]
        for current, ohms in given:
            volts = current * ohms
            items.append(_calc(title, f"{_fmt(current)} A through {_fmt(ohms)} ohm produces", f"{_fmt(volts)} V", _wrongs(f"{_fmt(volts)} V", f"{_fmt(current + ohms)} V", f"{_fmt(ohms / current)} V", f"{_fmt(volts / 2)} V"), f"V = IR = {_fmt(current)} × {_fmt(ohms)} V.", "numerical"))
            resistance = volts / current
            items.append(_calc(title, f"{_fmt(volts)} V at {_fmt(current)} A implies a resistance of", f"{_fmt(resistance)} ohm", _wrongs(f"{_fmt(resistance)} ohm", f"{_fmt(volts * current)} ohm", f"{_fmt(current / volts)} ohm", f"{_fmt(resistance + 5)} ohm"), f"R = V/I = {_fmt(volts)}/{_fmt(current)} ohm.", "numerical"))
    elif kind == "series":
        cases = [(12, 2, 4), (18, 3, 6), (24, 4, 8), (10, 1, 4), (20, 5, 5), (30, 4, 6), (15, 2, 3), (36, 6, 6)]
        for volts, r1, r2 in cases:
            total = r1 + r2
            current = volts / total
            items.append(_calc(title, f"{_fmt(volts)} V across {_fmt(r1)} ohm in series with {_fmt(r2)} ohm. The current is", f"{_fmt(current)} A", _wrongs(f"{_fmt(current)} A", f"{_fmt(volts / r1)} A", f"{_fmt(volts / r2)} A", f"{_fmt(current * 2)} A"), f"R = {_fmt(r1)}+{_fmt(r2)}. I = {_fmt(volts)}/{_fmt(total)} A.", "numerical"))
            drop = current * r1
            items.append(_calc(title, f"In that {_fmt(volts)} V string, the {_fmt(r1)} ohm element drops", f"{_fmt(drop)} V", _wrongs(f"{_fmt(drop)} V", f"{_fmt(volts)} V", f"{_fmt(current * r2)} V", f"{_fmt(drop + 1)} V"), f"V1 = IR1 = {_fmt(current)} × {_fmt(r1)} V.", "numerical"))
        more = [(9, 1, 2), (16, 3, 5), (21, 2, 5), (28, 3, 4), (8, 1, 3), (40, 4, 6), (14, 2, 5), (27, 4, 5)]
        for volts, r1, r2 in more:
            total = r1 + r2
            items.append(_calc(title, f"For the {_fmt(volts)} V series string, {_fmt(r1)} ohm plus {_fmt(r2)} ohm totals", f"{_fmt(total)} ohm", _wrongs(f"{_fmt(total)} ohm", f"{_fmt(r1 * r2)} ohm", f"{_fmt(abs(r1 - r2) or 1)} ohm", f"{_fmt(total + 3)} ohm"), "Series resistances add.", "numerical"))
            current = volts / total
            items.append(_calc(title, f"{_fmt(volts)} V on that {_fmt(total)} ohm string draws", f"{_fmt(current)} A", _wrongs(f"{_fmt(current)} A", f"{_fmt(volts)} A", f"{_fmt(total)} A", f"{_fmt(current + 2)} A"), f"I = {_fmt(volts)}/{_fmt(total)} A.", "numerical"))
    elif kind == "parallel":
        cases = [(12, 6, 3), (12, 12, 4), (10, 10, 10), (18, 9, 9), (24, 8, 8), (20, 5, 20), (15, 6, 3), (30, 10, 15)]
        for volts, r1, r2 in cases:
            req = 1 / (1 / r1 + 1 / r2)
            items.append(_calc(title, f"With {_fmt(volts)} V applied, {_fmt(r1)} ohm in parallel with {_fmt(r2)} ohm equals", f"{_fmt(req)} ohm", _wrongs(f"{_fmt(req)} ohm", f"{_fmt(r1 + r2)} ohm", f"{_fmt(r1 * r2)} ohm", f"{_fmt(req * 2)} ohm"), "Req is the reciprocal of the sum of reciprocals.", "numerical"))
            current = volts / req
            items.append(_calc(title, f"{_fmt(volts)} V across {_fmt(r1)} ohm parallel with {_fmt(r2)} ohm draws", f"{_fmt(current)} A", _wrongs(f"{_fmt(current)} A", f"{_fmt(volts / r1)} A", f"{_fmt(volts / (r1 + r2))} A", f"{_fmt(current / 2)} A"), f"I = V/Req = {_fmt(volts)}/{_fmt(req)} A.", "numerical"))
        extra = [(6, 3, 6), (8, 4, 12), (9, 6, 3), (16, 8, 8), (5, 2, 2), (14, 7, 7), (4, 4, 2), (21, 7, 21)]
        for it, r1, r2 in extra:
            i1 = it * r2 / (r1 + r2)
            items.append(_calc(title, f"Of {_fmt(it)} A into {_fmt(r1)} ohm parallel {_fmt(r2)} ohm, the {_fmt(r1)} ohm branch takes", f"{_fmt(i1)} A", _wrongs(f"{_fmt(i1)} A", f"{_fmt(it)} A", f"{_fmt(it * r1 / (r1 + r2))} A", f"{_fmt(i1 + 1)} A"), "The smaller resistor takes the larger share when they differ.", "numerical"))
            items.append(_calc(title, f"Of {_fmt(it)} A into {_fmt(r1)} ohm and {_fmt(r2)} ohm, the other branch carries", f"{_fmt(it - i1)} A", _wrongs(f"{_fmt(it - i1)} A", f"{_fmt(it)} A", f"{_fmt(i1)} A", f"{_fmt(it + i1)} A"), "The branches add to the source current.", "numerical"))
    elif kind == "kvl":
        loops = [(12, 5, 3), (18, 6, 4), (10, 2, 3), (24, 9, 7), (15, 4, 6), (20, 8, 5), (9, 2, 3), (30, 10, 12)]
        for vs, a, b in loops:
            missing = vs - a - b
            items.append(_calc(title, f"A loop has a {_fmt(vs)} V rise and drops of {_fmt(a)} V and {_fmt(b)} V. The remaining drop is", f"{_fmt(missing)} V", _wrongs(f"{_fmt(missing)} V", f"{_fmt(vs + a + b)} V", f"{_fmt(a + b)} V", f"{_fmt(abs(a - b))} V"), "The signed sum around the loop is zero.", "numerical"))
            items.append(_calc(title, f"The {_fmt(vs)} V rise and drops of {_fmt(a)} V and {_fmt(b)} V sum, as a check, to", f"{_fmt(vs)} V on the source side and {_fmt(a + b + missing)} V of drops", _wrongs("the source is larger than the drops", "the drops exceed the source", "the residual is 5 V", f"the residual is 0 because {_fmt(a)}+{_fmt(b)}+{_fmt(missing)}={_fmt(vs)}"), "Equal sums mean the loop agrees.", "numerical"))
        more = [(8, 1, 2, 5), (16, 4, 4, 8), (7, 1, 1, 5), (11, 2, 4, 5), (13, 3, 3, 7), (19, 6, 6, 7), (22, 5, 7, 10), (25, 8, 9, 8)]
        for vs, a, b, c in more:
            items.append(_calc(title, f"Drops {_fmt(a)}, {_fmt(b)}, and {_fmt(c)} V need a source of", f"{_fmt(a + b + c)} V", _wrongs(f"{_fmt(a + b + c)} V", f"{_fmt(vs)} V", f"{_fmt(a * b)} V", f"{_fmt(a + b)} V"), "Drops add to the source rise.", "numerical"))
            items.append(_calc(title, f"If the source is {_fmt(vs)} V and the drops are {_fmt(a)}, {_fmt(b)}, and {_fmt(c)} V, the residual is", f"{_fmt(vs - (a + b + c))} V", _wrongs(f"{_fmt(vs - (a + b + c))} V", "0 V", f"{_fmt(vs)} V", f"{_fmt(a + b + c)} V"), "Residual = source minus the sum of the drops.", "numerical"))
    elif kind == "kcl":
        nodes = [(10, 4, 6), (8, 3, 5), (12, 7, 5), (9, 2, 7), (15, 6, 9), (7, 1, 6), (11, 4, 7), (14, 5, 9)]
        for entering, leave1, leave2 in nodes:
            items.append(_calc(title, f"{_fmt(entering)} A enters and {_fmt(leave1)} A leaves. The other branch must leave", f"{_fmt(entering - leave1)} A", _wrongs(f"{_fmt(entering - leave1)} A", f"{_fmt(entering + leave1)} A", f"{_fmt(leave1)} A", f"{_fmt(entering)} A"), "Currents at the node sum to zero.", "numerical"))
            items.append(_calc(title, f"Check: {_fmt(leave1)} A + {_fmt(leave2)} A against {_fmt(entering)} A. The residual is", f"{_fmt(entering - leave1 - leave2)} A", _wrongs(f"{_fmt(entering - leave1 - leave2)} A", f"{_fmt(entering)} A", f"{_fmt(leave1 + leave2)} A", "0 A"), "Residual = entering minus the leaving currents.", "numerical"))
        extra = [(5, 2), (6, 1), (8, 3), (9, 4), (4, 4), (7, 2), (3, 3), (10, 6)]
        for i1, i2 in extra:
            items.append(_calc(title, f"Two branches leave a node with {_fmt(i1)} A and {_fmt(i2)} A. The source must supply", f"{_fmt(i1 + i2)} A", _wrongs(f"{_fmt(i1 + i2)} A", f"{_fmt(abs(i1 - i2))} A", f"{_fmt(i1 * i2)} A", f"{_fmt(i1)} A"), "Leaving currents add to the entering current.", "numerical"))
            items.append(_calc(title, f"If the source is {_fmt(i1 + i2)} A, the share not in the {_fmt(i1)} A branch is", f"{_fmt(i2)} A", _wrongs(f"{_fmt(i2)} A", f"{_fmt(i1 + i2)} A", f"{_fmt(i1)} A", "0 A"), "The remainder is the other branch.", "numerical"))
    elif kind == "vdiv":
        cases = [(12, 2, 2), (12, 1, 3), (18, 3, 6), (24, 4, 4), (10, 1, 4), (30, 2, 4), (15, 2, 3), (20, 1, 3)]
        for vin, r1, r2 in cases:
            vout = vin * r2 / (r1 + r2)
            items.append(_calc(title, f"{_fmt(vin)} V across top {_fmt(r1)} ohm and bottom {_fmt(r2)} ohm. Vout is", f"{_fmt(vout)} V", _wrongs(f"{_fmt(vout)} V", f"{_fmt(vin)} V", f"{_fmt(vin * r1 / (r1 + r2))} V", f"{_fmt(vout / 2)} V"), f"Vout = Vin × R2/(R1+R2).", "numerical"))
            items.append(_calc(title, f"The series current for {_fmt(vin)} V across {_fmt(r1)} ohm and {_fmt(r2)} ohm is", f"{_fmt(vin / (r1 + r2))} A", _wrongs(f"{_fmt(vin / (r1 + r2))} A", f"{_fmt(vin / r2)} A", f"{_fmt(vin / r1)} A", f"{_fmt(vout)} A"), "One current flows through both resistors.", "numerical"))
        more = [(8, 1, 1), (16, 1, 3), (9, 2, 1), (21, 3, 4), (6, 1, 2), (28, 3, 4), (14, 5, 2), (36, 5, 7)]
        for vin, r1, r2 in more:
            vout = vin * r2 / (r1 + r2)
            items.append(_calc(title, f"For a {_fmt(vin)} V divider, the fraction across the bottom {_fmt(r2)} ohm of {_fmt(r1)}+{_fmt(r2)} is", f"{_fmt(r2 / (r1 + r2))}", _wrongs(f"{_fmt(r2 / (r1 + r2))}", "1", f"{_fmt(r1 / r2)}", "0"), "The fraction is R2 over the total.", "numerical"))
            items.append(_calc(title, f"So {_fmt(vin)} V yields an output of", f"{_fmt(vout)} V", _wrongs(f"{_fmt(vout)} V", f"{_fmt(vin)} V", f"{_fmt(vin / 2)} V", f"{_fmt(vout + 2)} V"), "Multiply the source by that fraction.", "numerical"))
    else:
        cases = [(6, 2, 2), (9, 1, 2), (12, 2, 4), (8, 1, 3), (10, 4, 1), (15, 2, 3), (7, 3, 4), (18, 3, 6)]
        for it, r1, r2 in cases:
            i1 = it * r2 / (r1 + r2)
            items.append(_calc(title, f"{_fmt(it)} A splits across R1={_fmt(r1)} ohm and R2={_fmt(r2)} ohm. Current in R1 is", f"{_fmt(i1)} A", _wrongs(f"{_fmt(i1)} A", f"{_fmt(it)} A", f"{_fmt(it * r1 / (r1 + r2))} A", f"{_fmt(i1 + 1)} A"), "I1 = It × R2/(R1+R2).", "numerical"))
            items.append(_calc(title, f"With {_fmt(it)} A, R1={_fmt(r1)} ohm and R2={_fmt(r2)} ohm, current in R2 is", f"{_fmt(it - i1)} A", _wrongs(f"{_fmt(it - i1)} A", f"{_fmt(it)} A", f"{_fmt(i1)} A", "0 A"), "I2 = It - I1.", "numerical"))
        extra = [(4, 1, 1), (5, 2, 3), (11, 5, 6), (13, 3, 10), (16, 4, 12), (3, 1, 2), (14, 7, 7), (20, 5, 15)]
        for it, r1, r2 in extra:
            i1 = it * r2 / (r1 + r2)
            items.append(_calc(title, f"Equal check: R1 {_fmt(r1)} and R2 {_fmt(r2)} with {_fmt(it)} A. The larger current is", f"{_fmt(max(i1, it - i1))} A", _wrongs(f"{_fmt(max(i1, it - i1))} A", f"{_fmt(it)} A", "0 A", f"{_fmt(min(i1, it - i1))} A"), "The smaller resistor carries more current.", "numerical"))
            items.append(_calc(title, f"For {_fmt(it)} A, R1 {_fmt(r1)} ohm and R2 {_fmt(r2)} ohm, the two branch currents add to", f"{_fmt(it)} A", _wrongs(f"{_fmt(it)} A", f"{_fmt(i1)} A", f"{_fmt(it * 2)} A", "0 A"), "KCL: the branches reassemble the source current.", "numerical"))
    if len(items) < 32:
        raise RuntimeError(f"{title} medium {len(items)}")
    return items[:32]


def _tau_questions(title: str, mode: str) -> list[dict]:
    items: list[dict] = []
    pairs = [(1000, 0.001), (2000, 0.001), (1000, 0.002), (500, 0.002), (4000, 0.0005), (10000, 0.0001), (2500, 0.0004), (8000, 0.00025)]
    for resistance, capacitance in pairs:
        tau = resistance * capacitance
        if mode == "rc":
            items.append(_calc(title, f"R = {_fmt(resistance)} ohm and C = {_fmt(capacitance)} F. Tau is", f"{_fmt(tau)} s", _wrongs(f"{_fmt(tau)} s", f"{_fmt(resistance / capacitance)} s", f"{_fmt(capacitance / resistance)} s", f"{_fmt(tau * 2)} s"), "Tau = RC.", "numerical"))
            volts = 10 if tau != 1 else 5
            items.append(_calc(title, f"With {_fmt(volts)} V, R = {_fmt(resistance)} ohm and C = {_fmt(capacitance)} F, the initial charging current is", f"{_fmt(volts / resistance)} A", _wrongs(f"{_fmt(volts / resistance)} A", f"{_fmt(volts * resistance)} A", "0 A", f"{_fmt(volts)} A"), "An uncharged capacitor initially looks like a short, so I = V/R.", "numerical"))
        else:
            # reuse numbers as L in henry and R, tau = L/R
            inductance = capacitance * 1000
            tau_l = inductance / resistance
            items.append(_calc(title, f"L = {_fmt(inductance)} H and R = {_fmt(resistance)} ohm. Tau is", f"{_fmt(tau_l)} s", _wrongs(f"{_fmt(tau_l)} s", f"{_fmt(inductance * resistance)} s", f"{_fmt(resistance / inductance)} s", f"{_fmt(tau_l * 2)} s"), "Tau = L/R.", "numerical"))
            volts = 12
            items.append(_calc(title, f"The final current from {_fmt(volts)} V with L = {_fmt(inductance)} H and R = {_fmt(resistance)} ohm is", f"{_fmt(volts / resistance)} A", _wrongs(f"{_fmt(volts / resistance)} A", f"{_fmt(volts / inductance)} A", "0 A", f"{_fmt(volts)} A"), "In DC steady state the inductor is a short, so I = V/R.", "numerical"))
    volts_list = [5, 8, 10, 12, 6, 9, 15, 4]
    for volts in volts_list:
        target = volts * (1 - math.exp(-1))
        if mode == "rc":
            items.append(_calc(title, f"At t = tau, an uncharged capacitor fed by {_fmt(volts)} V has reached about", f"{_fmt(target)} V", _wrongs(f"{_fmt(target)} V", f"{_fmt(volts)} V", "0 V", f"{_fmt(volts / 2)} V"), "The step response is Vin(1 - e^(-t/tau)), which is about 63 percent at one tau.", "numerical"))
            items.append(_calc(title, f"After many time constants, a {_fmt(volts)} V step leaves the capacitor at", f"{_fmt(volts)} V", _wrongs(f"{_fmt(volts)} V", "0 V", f"{_fmt(target)} V", f"{_fmt(volts / 2)} V"), "The exponential finishes at the source voltage.", "numerical"))
        else:
            final = volts / 10
            at_tau = final * (1 - math.exp(-1))
            items.append(_calc(title, f"R = 10 ohm and Vin = {_fmt(volts)} V. Current at t = tau is about", f"{_fmt(at_tau)} A", _wrongs(f"{_fmt(at_tau)} A", f"{_fmt(final)} A", "0 A", f"{_fmt(volts)} A"), "i(t) = (V/R)(1 - e^(-t/tau)).", "numerical"))
            items.append(_calc(title, f"For a {_fmt(volts)} V step, the inductor voltage at the first instant is", f"{_fmt(volts)} V", _wrongs(f"{_fmt(volts)} V", "0 V", f"{_fmt(final)} V", f"{_fmt(at_tau)} V"), "Current cannot jump, so the inductor initially holds the full source voltage.", "numerical"))
    return items[:32]


def _medium_special(experiment_id: str, title: str) -> list[dict]:
    items: list[dict] = []
    if experiment_id in {"ohms-law"}:
        return _medium_resistive(title, "ohms")
    if experiment_id == "series-circuit":
        return _medium_resistive(title, "series")
    if experiment_id == "parallel-circuit":
        return _medium_resistive(title, "parallel")
    if experiment_id == "kvl":
        return _medium_resistive(title, "kvl")
    if experiment_id == "kcl":
        return _medium_resistive(title, "kcl")
    if experiment_id == "voltage-divider":
        return _medium_resistive(title, "vdiv")
    if experiment_id == "current-divider":
        return _medium_resistive(title, "cdiv")
    if experiment_id in {"rc-circuit", "capacitor-charging"}:
        return _tau_questions(title, "rc")
    if experiment_id == "rl-circuit":
        return _tau_questions(title, "rl")
    if experiment_id == "rlc-circuit":
        cases = [
            (10, 0.1, 0.0001),
            (20, 0.2, 0.0001),
            (40, 0.2, 0.0002),
            (5, 0.05, 0.00005),
            (15, 0.05, 0.0001),
            (8, 0.4, 0.0002),
            (25, 0.01, 0.0001),
            (12, 0.08, 0.00005),
        ]
        for resistance, inductance, capacitance in cases:
            boundary = 2 * math.sqrt(inductance / capacitance)
            f0 = 1 / (2 * math.pi * math.sqrt(inductance * capacitance))
            items.append(_calc(title, f"L = {_fmt(inductance)} H and C = {_fmt(capacitance)} F. The series damping boundary 2√(L/C) is", f"{_fmt(boundary)} ohm", _wrongs(f"{_fmt(boundary)} ohm", f"{_fmt(boundary / 2)} ohm", f"{_fmt(resistance)} ohm", f"{_fmt(boundary * 2)} ohm"), "The series loop is underdamped below that resistance.", "numerical"))
            items.append(_calc(title, f"With R = {_fmt(resistance)} ohm, L = {_fmt(inductance)} H and C = {_fmt(capacitance)} F, this loop is", "underdamped" if resistance < boundary else "overdamped", _wrongs("underdamped" if resistance < boundary else "overdamped", "overdamped" if resistance < boundary else "underdamped", "a DC short", "unrelated to R"), "Compare R with 2√(L/C).", "numerical"))
            items.append(_calc(title, f"L = {_fmt(inductance)} H and C = {_fmt(capacitance)} F. The lightly damped ring is near", f"{_fmt(f0)} Hz", _wrongs(f"{_fmt(f0)} Hz", f"{_fmt(f0 * 2)} Hz", f"{_fmt(resistance)} Hz", "0 Hz"), "f0 = 1/(2π√(LC)).", "numerical"))
            items.append(_calc(title, f"Doubling L = {_fmt(inductance)} H and C = {_fmt(capacitance)} F moves the ring", f"to {_fmt(1 / (2 * math.pi * math.sqrt(4 * inductance * capacitance)))} Hz", _wrongs(f"{_fmt(1 / (2 * math.pi * math.sqrt(4 * inductance * capacitance)))} Hz", f"{_fmt(f0)} Hz", f"{_fmt(f0 * 2)} Hz", "0 Hz"), "√(4LC) = 2√(LC), so f0 is halved.", "numerical"))
        return items[:32]
    if experiment_id == "series-resonance":
        cases = [(10, 0.1, 1e-5), (20, 0.1, 1e-5), (10, 0.2, 1e-5), (50, 0.05, 2e-5), (25, 0.1, 1e-5), (5, 0.1, 1e-5), (40, 0.4, 1e-5), (15, 0.15, 1.5e-5)]
        for resistance, inductance, capacitance in cases:
            f0 = 1 / (2 * math.pi * math.sqrt(inductance * capacitance))
            q = math.sqrt(inductance / capacitance) / resistance
            bw = f0 / q
            items.append(_calc(title, f"R = {_fmt(resistance)} ohm, L = {_fmt(inductance)} H, C = {_fmt(capacitance)} F. f0 is", f"{_fmt(f0)} Hz", _wrongs(f"{_fmt(f0)} Hz", f"{_fmt(f0 * 2)} Hz", f"{_fmt(resistance)} Hz", f"{_fmt(f0 / 2)} Hz"), "f0 = 1/(2π√(LC)).", "numerical"))
            items.append(_calc(title, f"R = {_fmt(resistance)} ohm, L = {_fmt(inductance)} H, C = {_fmt(capacitance)} F. Q is", f"{_fmt(q)}", _wrongs(f"{_fmt(q)}", f"{_fmt(resistance)}", f"{_fmt(f0)}", "1"), "Q = (1/R)√(L/C).", "numerical"))
            items.append(_calc(title, f"R = {_fmt(resistance)} ohm, L = {_fmt(inductance)} H, C = {_fmt(capacitance)} F. Bandwidth is", f"{_fmt(bw)} Hz", _wrongs(f"{_fmt(bw)} Hz", f"{_fmt(f0)} Hz", f"{_fmt(q)} Hz", f"{_fmt(bw * 2)} Hz"), "BW = f0/Q = R/(2πL) for this series form.", "numerical"))
            items.append(_calc(title, f"At resonance, R = {_fmt(resistance)} ohm, L = {_fmt(inductance)} H and a 5 V source produce a current of", f"{_fmt(5 / resistance)} A", _wrongs(f"{_fmt(5 / resistance)} A", f"{_fmt(5 * resistance)} A", f"{_fmt(f0)} A", "0 A"), "Z = R at series resonance, so I = Vin/R.", "numerical"))
        return items[:32]
    if experiment_id == "half-wave-rectifier":
        peaks = [(5, 50, 1000), (8, 60, 2200), (10, 400, 470), (12, 1000, 100), (15, 120, 330), (6, 250, 1500), (9, 500, 680), (20, 100, 2000)]
        for peak, frequency, load in peaks:
            vout = peak - 0.7
            avg = vout / math.pi
            items.append(_calc(title, f"Vin peak {_fmt(peak)} V and Vf = 0.7 V. Vout peak is", f"{_fmt(vout)} V", _wrongs(f"{_fmt(vout)} V", f"{_fmt(peak)} V", f"{_fmt(peak + 0.7)} V", "0 V"), "One diode drop comes off the peak.", "numerical"))
            items.append(_calc(title, f"The idealised average of that {_fmt(peak)} V peak pulse is", f"{_fmt(avg)} V", _wrongs(f"{_fmt(avg)} V", f"{_fmt(vout)} V", f"{_fmt(2 * avg)} V", f"{_fmt(peak)} V"), "Half-wave average is Vpeak/π after the drop.", "numerical"))
            items.append(_calc(title, f"A {_fmt(frequency)} Hz half-wave source has ripple frequency", f"{_fmt(frequency)} Hz", _wrongs(f"{_fmt(frequency)} Hz", f"{_fmt(frequency * 2)} Hz", f"{_fmt(frequency / 2)} Hz", "0 Hz"), "One pulse per cycle, so the ripple equals the source frequency.", "numerical"))
            items.append(_calc(title, f"With Vout peak {_fmt(vout)} V and a {_fmt(load)} ohm load, peak load current is", f"{_fmt(vout / load)} A", _wrongs(f"{_fmt(vout / load)} A", f"{_fmt(peak / load)} A", f"{_fmt(vout)} A", "0 A"), "Ipeak = Vout peak / RL.", "numerical"))
        return items[:32]
    if experiment_id == "full-wave-bridge-rectifier":
        peaks = [(6, 50, 100), (8, 60, 220), (10, 400, 470), (12, 100, 1000), (14, 120, 330), (16, 250, 150), (18, 500, 680), (20, 1000, 2000)]
        for peak, frequency, load in peaks:
            vout = peak - 1.4
            avg = 2 * vout / math.pi
            items.append(_calc(title, f"Vin peak {_fmt(peak)} V and two diode drops of 0.7 V. Vout peak is", f"{_fmt(vout)} V", _wrongs(f"{_fmt(vout)} V", f"{_fmt(peak - 0.7)} V", f"{_fmt(peak)} V", "0 V"), "The conducting pair drops about 1.4 V.", "numerical"))
            items.append(_calc(title, f"The average of those {_fmt(peak)} V peak full-wave pulses is", f"{_fmt(avg)} V", _wrongs(f"{_fmt(avg)} V", f"{_fmt(vout / math.pi)} V", f"{_fmt(vout)} V", f"{_fmt(peak)} V"), "Full-wave average is 2 Vpeak/π.", "numerical"))
            items.append(_calc(title, f"A {_fmt(frequency)} Hz bridge has ripple frequency", f"{_fmt(frequency * 2)} Hz", _wrongs(f"{_fmt(frequency * 2)} Hz", f"{_fmt(frequency)} Hz", f"{_fmt(frequency / 2)} Hz", f"{_fmt(frequency * 4)} Hz"), "Two pulses per cycle, so the ripple is 2f.", "numerical"))
            items.append(_calc(title, f"With Vout peak {_fmt(vout)} V and a {_fmt(load)} ohm load, peak load current is", f"{_fmt(vout / load)} A", _wrongs(f"{_fmt(vout / load)} A", f"{_fmt(peak / load)} A", f"{_fmt(vout)} A", "0 A"), "Ipeak = Vout peak / RL.", "numerical"))
        return items[:32]
    if experiment_id == "diode-characteristics":
        cases = [(5, 100, 0.7), (9, 330, 0.7), (12, 1000, 0.7), (5, 220, 0.7), (15, 1500, 0.7), (3, 100, 0.7), (10, 470, 0.7), (6, 560, 0.7)]
        for vs, resistance, vf in cases:
            current = (vs - vf) / resistance
            items.append(_calc(title, f"Vs = {_fmt(vs)} V, R = {_fmt(resistance)} ohm, Vf = 0.7 V. Diode current is", f"{_fmt(current)} A", _wrongs(f"{_fmt(current)} A", f"{_fmt(vs / resistance)} A", f"{_fmt(vf / resistance)} A", "0 A"), "I = (Vs - Vf)/R once the diode is on.", "numerical"))
            items.append(_calc(title, f"With Vs = {_fmt(vs)} V and Vf = 0.7 V, voltage left on the {_fmt(resistance)} ohm resistor is", f"{_fmt(vs - vf)} V", _wrongs(f"{_fmt(vs - vf)} V", f"{_fmt(vs)} V", f"{_fmt(vf)} V", "0 V"), "The resistor gets what the diode does not.", "numerical"))
            items.append(_calc(title, f"If the Vs = {_fmt(vs)} V, R = {_fmt(resistance)} ohm circuit instead sees 0.4 V with a 0.7 V knee, the model current is", "about 0", _wrongs("about 0", f"{_fmt(0.4 / resistance)} A", f"{_fmt(vs / resistance)} A", f"{_fmt(vf)} A"), "Below the knee the simple model does not turn the diode on.", "numerical"))
            items.append(_calc(title, f"Resistor power at {_fmt(current)} A in the {_fmt(resistance)} ohm resistor is", f"{_fmt(current * current * resistance)} W", _wrongs(f"{_fmt(current * current * resistance)} W", f"{_fmt(vs * current)} W", f"{_fmt(vf * current)} W", "0 W"), "P = I²R in the series resistor.", "numerical"))
        return items[:32]
    if experiment_id == "led-circuit":
        cases = [(5, 2, 0.02), (9, 2, 0.02), (12, 1.8, 0.015), (5, 3, 0.01), (9, 3.2, 0.01), (12, 2, 0.02), (6, 2, 0.015), (15, 2, 0.02)]
        for vs, vf, current in cases:
            resistance = (vs - vf) / current
            items.append(_calc(title, f"Vs = {_fmt(vs)} V, Vf = {_fmt(vf)} V, target I = {_fmt(current)} A. R is", f"{_fmt(resistance)} ohm", _wrongs(f"{_fmt(resistance)} ohm", f"{_fmt(vs / current)} ohm", f"{_fmt(vf / current)} ohm", f"{_fmt(resistance / 2)} ohm"), "R = (Vs - Vf)/I.", "numerical"))
            items.append(_calc(title, f"LED power at Vs = {_fmt(vs)} V, Vf = {_fmt(vf)} V and I = {_fmt(current)} A is", f"{_fmt(vf * current)} W", _wrongs(f"{_fmt(vf * current)} W", f"{_fmt(vs * current)} W", f"{_fmt(resistance)} W", "0 W"), "P = Vf × I.", "numerical"))
            items.append(_calc(title, f"Resistor power for Vs = {_fmt(vs)} V, Vf = {_fmt(vf)} V and I = {_fmt(current)} A is", f"{_fmt((vs - vf) * current)} W", _wrongs(f"{_fmt((vs - vf) * current)} W", f"{_fmt(vf * current)} W", f"{_fmt(vs * current)} W", "0 W"), "The resistor drops Vs - Vf.", "numerical"))
            items.append(_calc(title, f"If the LED on the {_fmt(vs)} V, {_fmt(resistance)} ohm circuit is reversed, the simple model current is", "about 0", _wrongs("about 0", f"{_fmt(current)} A", f"{_fmt(vs / resistance)} A", f"{_fmt(vf)} A"), "A reversed LED does not pass the forward current.", "numerical"))
        return items[:32]
    if experiment_id == "wheatstone-bridge":
        cases = [(100, 200, 300), (1, 2, 2), (10, 10, 10), (150, 300, 100), (470, 470, 1000), (200, 100, 50), (1000, 2000, 500), (330, 660, 330)]
        for r1, r2, r3 in cases:
            rx = r2 * r3 / r1
            items.append(_calc(title, f"Balance with R1={_fmt(r1)}, R2={_fmt(r2)}, R3={_fmt(r3)}. R4 is", f"{_fmt(rx)} ohm", _wrongs(f"{_fmt(rx)} ohm", f"{_fmt(r1 + r2 + r3)} ohm", f"{_fmt(r1)} ohm", f"{_fmt(r2)} ohm"), "R1/R2 = R3/R4, so R4 = R2 R3 / R1.", "numerical"))
            items.append(_calc(title, f"At balance for R1={_fmt(r1)}, R2={_fmt(r2)}, R3={_fmt(r3)}, the detector voltage is", "0 V", _wrongs("0 V", f"{_fmt(r1)} V", f"{_fmt(rx)} V", "the source voltage"), "Equal ratios null the detector.", "numerical"))
            items.append(_calc(title, f"If R4 is twice {_fmt(rx)} ohm for R1={_fmt(r1)}, R2={_fmt(r2)}, R3={_fmt(r3)}, the bridge is", "unbalanced", _wrongs("unbalanced", "still nulled", "shorted", "resonant"), "Only the balance ratio nulls the detector.", "numerical"))
            items.append(_calc(title, f"The ratio R1/R2 for R1={_fmt(r1)} and R2={_fmt(r2)} is", f"{_fmt(r1 / r2)}", _wrongs(f"{_fmt(r1 / r2)}", f"{_fmt(r2 / r1)}", "0", "1 always"), "Balance compares this ratio with R3/R4.", "numerical"))
        return items[:32]
    if experiment_id == "potentiometer":
        cases = [(10, 0.25), (10, 0.5), (10, 0.75), (12, 0.5), (5, 0.2), (8, 0.4), (15, 1), (9, 0)]
        for vin, frac in cases:
            vout = vin * frac
            items.append(_calc(title, f"Vin = {_fmt(vin)} V and the wiper fraction is {_fmt(frac)}. Vout is", f"{_fmt(vout)} V", _wrongs(f"{_fmt(vout)} V", f"{_fmt(vin)} V", f"{_fmt(vin * (1 - frac))} V", "0 V" if vout != 0 else f"{_fmt(vin)} V"), "Vout = Vin × fraction.", "numerical"))
            items.append(_calc(title, f"With Vin = {_fmt(vin)} V and wiper fraction {_fmt(frac)}, the fraction left above the wiper is", f"{_fmt(1 - frac)}", _wrongs(f"{_fmt(1 - frac)}", f"{_fmt(frac)}", "0", "2"), "The two fractions add to 1.", "numerical"))
            items.append(_calc(title, f"A grounded bottom end of the {_fmt(vin)} V potentiometer, with the wiper at {_fmt(frac)}, reads at fraction 0", "0 V", _wrongs("0 V", f"{_fmt(vin)} V", f"{_fmt(vout)} V" if vout != 0 else f"{_fmt(vin / 2)} V", f"{_fmt(vin / 2)} V" if vout != 0 else f"{_fmt(frac + 1)} V"), "The bottom stop is the reference.", "numerical"))
            items.append(_calc(title, f"The top end of the {_fmt(vin)} V potentiometer, with the wiper at {_fmt(frac)}, reads", f"{_fmt(vin)} V", _wrongs(f"{_fmt(vin)} V", "0 V", f"{_fmt(vout)} V" if vout != vin else f"{_fmt(vin / 2)} V", f"{_fmt(vin / 2)} V"), "The top of the element is the input.", "numerical"))
        return items[:32]
    if experiment_id == "superposition-theorem":
        cases = [(4, -1), (6, 2), (3, 3), (8, -8), (5, 1), (2, 7), (-2, 5), (9, -4)]
        for a, b in cases:
            items.append(_calc(title, f"Source A alone gives {_fmt(a)} V and source B alone gives {_fmt(b)} V. The sum is", f"{_fmt(a + b)} V", _wrongs(f"{_fmt(a + b)} V", f"{_fmt(a * b)} V", f"{_fmt(abs(a) + abs(b))} V", f"{_fmt(a)} V"), "Linear contributions add with their signs.", "numerical"))
            items.append(_calc(title, f"Power from the {_fmt(a)} V contribution and the {_fmt(b)} V contribution must", "not be added as if they were voltages", _wrongs("not be added as if they were voltages", "add in the same way as the voltages", "always cancel", "replace the voltage sum"), "Power is not linear, so it is not superimposed.", "numerical"))
            items.append(_calc(title, f"If the {_fmt(a)} V and {_fmt(b)} V contributions both scale by 2, the summed voltage becomes", f"{_fmt(2 * (a + b))} V", _wrongs(f"{_fmt(2 * (a + b))} V", f"{_fmt(a + b)} V", f"{_fmt((a + b) ** 2)} V", "0 V"), "A linear response scales with the sources.", "numerical"))
            items.append(_calc(title, f"With the {_fmt(a)} V and {_fmt(b)} V sources both deactivated, a resistive response is", "0", _wrongs("0", f"{_fmt(a + b)}", f"{_fmt(a)}", f"{_fmt(b)}"), "No excitation, no response.", "numerical"))
        return items[:32]
    if experiment_id == "thevenin-theorem":
        cases = [(12, 3, 3), (10, 5, 5), (9, 1, 2), (12, 2, 4), (6, 1, 1), (15, 5, 10), (8, 2, 6), (20, 4, 6)]
        for vth, rth, rl in cases:
            il = vth / (rth + rl)
            vl = il * rl
            items.append(_calc(title, f"Vth = {_fmt(vth)} V, Rth = {_fmt(rth)} ohm, RL = {_fmt(rl)} ohm. IL is", f"{_fmt(il)} A", _wrongs(f"{_fmt(il)} A", f"{_fmt(vth / rth)} A", f"{_fmt(vth / rl)} A", f"{_fmt(il * 2)} A"), "IL = Vth / (Rth + RL).", "numerical"))
            items.append(_calc(title, f"Load voltage for Vth = {_fmt(vth)} V, Rth = {_fmt(rth)} ohm and RL = {_fmt(rl)} ohm is", f"{_fmt(vl)} V", _wrongs(f"{_fmt(vl)} V", f"{_fmt(vth)} V", f"{_fmt(il * rth)} V", "0 V"), "VL = IL × RL.", "numerical"))
            items.append(_calc(title, f"Load power for Vth = {_fmt(vth)} V, Rth = {_fmt(rth)} ohm and RL = {_fmt(rl)} ohm is", f"{_fmt(il * vl)} W", _wrongs(f"{_fmt(il * vl)} W", f"{_fmt(vth * il)} W", f"{_fmt(vth)} W", "0 W"), "P = IL × VL.", "numerical"))
            items.append(_calc(title, f"Open-circuit voltage for Vth = {_fmt(vth)} V and Rth = {_fmt(rth)} ohm is", f"{_fmt(vth)} V", _wrongs(f"{_fmt(vth)} V", f"{_fmt(vl)} V", "0 V", f"{_fmt(rth)} V"), "Vth is the open-circuit voltage.", "numerical"))
        return items[:32]
    if experiment_id == "norton-theorem":
        cases = [(2, 8, 8), (1, 10, 10), (4, 6, 3), (3, 12, 6), (2, 4, 4), (5, 5, 5), (1, 6, 3), (2, 10, 15)]
        for inn, rn, rl in cases:
            rp = 1 / (1 / rn + 1 / rl)
            vl = inn * rp
            items.append(_calc(title, f"In = {_fmt(inn)} A, Rn = {_fmt(rn)} ohm, RL = {_fmt(rl)} ohm. VL is", f"{_fmt(vl)} V", _wrongs(f"{_fmt(vl)} V", f"{_fmt(inn * rn)} V", f"{_fmt(inn * rl)} V", f"{_fmt(vl / 2)} V"), "VL = In × (Rn parallel RL).", "numerical"))
            items.append(_calc(title, f"With In = {_fmt(inn)} A, Rn = {_fmt(rn)} ohm in parallel with RL = {_fmt(rl)} ohm is", f"{_fmt(rp)} ohm", _wrongs(f"{_fmt(rp)} ohm", f"{_fmt(rn + rl)} ohm", f"{_fmt(rn)} ohm", f"{_fmt(rl)} ohm"), "Two resistors in parallel.", "numerical"))
            items.append(_calc(title, f"Load current for In = {_fmt(inn)} A, Rn = {_fmt(rn)} ohm and RL = {_fmt(rl)} ohm is", f"{_fmt(vl / rl)} A", _wrongs(f"{_fmt(vl / rl)} A", f"{_fmt(inn)} A", f"{_fmt(vl / rn)} A", "0 A"), "IL = VL / RL.", "numerical"))
            items.append(_calc(title, f"The port short current for In = {_fmt(inn)} A and Rn = {_fmt(rn)} ohm is", f"{_fmt(inn)} A", _wrongs(f"{_fmt(inn)} A", f"{_fmt(vl / rl)} A", "0 A", f"{_fmt(rn)} A"), "In is defined by a short at the port.", "numerical"))
        return items[:32]
    if experiment_id == "maximum-power-transfer":
        cases = [(10, 5), (12, 3), (8, 2), (20, 10), (6, 1), (15, 5), (9, 3), (16, 4)]
        for vth, rth in cases:
            pmax = vth ** 2 / (4 * rth)
            il = vth / (2 * rth)
            items.append(_calc(title, f"Vth = {_fmt(vth)} V and Rth = {_fmt(rth)} ohm. Maximum load power is", f"{_fmt(pmax)} W", _wrongs(f"{_fmt(pmax)} W", f"{_fmt(vth ** 2 / rth)} W", f"{_fmt(vth * rth)} W", f"{_fmt(pmax / 2)} W"), "Pmax = Vth² / (4 Rth).", "numerical"))
            items.append(_calc(title, f"The load that reaches maximum power for Vth = {_fmt(vth)} V and Rth = {_fmt(rth)} ohm is", f"{_fmt(rth)} ohm", _wrongs(f"{_fmt(rth)} ohm", f"{_fmt(rth * 2)} ohm", f"{_fmt(rth / 2)} ohm", "0 ohm"), "RL = Rth.", "numerical"))
            items.append(_calc(title, f"Load current at maximum power for Vth = {_fmt(vth)} V and Rth = {_fmt(rth)} ohm is", f"{_fmt(il)} A", _wrongs(f"{_fmt(il)} A", f"{_fmt(vth / rth)} A", f"{_fmt(vth)} A", "0 A"), "I = Vth / (2 Rth).", "numerical"))
            items.append(_calc(title, f"Efficiency at RL = Rth = {_fmt(rth)} ohm for Vth = {_fmt(vth)} V is", "50%", _wrongs("50%", "100%", "0%", "25%"), "Half the voltage is across Rth.", "numerical"))
        return items[:32]
    if experiment_id == "rc-low-pass-filter":
        cases = [(1000, 1e-7), (1000, 1e-6), (2000, 1e-7), (500, 1e-6), (10000, 1e-8), (4000, 1e-7), (2000, 5e-7), (1000, 1.59e-4)]
        for resistance, capacitance in cases:
            fc = 1 / (2 * math.pi * resistance * capacitance)
            items.append(_calc(title, f"R = {_fmt(resistance)} ohm and C = {_fmt(capacitance)} F. Cutoff is", f"{_fmt(fc)} Hz", _wrongs(f"{_fmt(fc)} Hz", f"{_fmt(fc * 2)} Hz", f"{_fmt(resistance * capacitance)} Hz", f"{_fmt(fc / 10)} Hz"), "fc = 1/(2πRC).", "numerical"))
            gain = 1 / math.sqrt(2)
            items.append(_calc(title, f"Gain at the {_fmt(fc)} Hz cutoff of R = {_fmt(resistance)} ohm and C = {_fmt(capacitance)} F is", f"{_fmt(gain)}", _wrongs(f"{_fmt(gain)}", "1", "0.5", "0"), " |H| = 1/√2 at fc.", "numerical"))
            high = 1 / math.sqrt(1 + 100)
            items.append(_calc(title, f"Gain at 10 times the {_fmt(fc)} Hz cutoff of R = {_fmt(resistance)} ohm and C = {_fmt(capacitance)} F is about", f"{_fmt(high)}", _wrongs(f"{_fmt(high)}", "1", f"{_fmt(gain)}", "0"), " |H| = 1/√(1+(f/fc)²).", "numerical"))
            items.append(_calc(title, f"A 5 V peak sine at the {_fmt(fc)} Hz cutoff of R = {_fmt(resistance)} ohm and C = {_fmt(capacitance)} F has an output peak near", f"{_fmt(5 * gain)} V", _wrongs(f"{_fmt(5 * gain)} V", "5 V", f"{_fmt(5 * high)} V", "0 V"), "Multiply the input peak by the gain.", "numerical"))
        return items[:32]
    raise RuntimeError(experiment_id)


def _hard_for(experiment_id: str, title: str) -> list[dict]:
    """Multi-step checks and solver-interpretation items. Category stays troubleshooting."""
    items: list[dict] = []
    specs = [
        (10, 4, 2.0),
        (12, 3, 3.0),
        (9, 3, 2.5),
        (15, 5, 2.0),
        (8, 2, 3.0),
        (20, 4, 4.0),
        (6, 2, 2.5),
        (18, 6, 2.0),
    ]
    for volts, ohms, reported in specs:
        expected = volts / ohms
        consistent = abs(expected - reported) < 1e-9
        items.append(
            _calc(
                title,
                f"A solved run shows {_fmt(volts)} V and {_fmt(reported)} A on a {_fmt(ohms)} ohm element. The current consistent with those ohms is",
                f"{_fmt(expected)} A",
                _wrongs(f"{_fmt(expected)} A", f"{_fmt(reported)} A", f"{_fmt(volts * ohms)} A", f"{_fmt(expected + 1)} A"),
                f"I = V/R = {_fmt(volts)}/{_fmt(ohms)} = {_fmt(expected)} A. The report matches that only if the numbers agree.",
                "troubleshooting",
            )
        )
        items.append(
            _calc(
                title,
                f"The solved pair {_fmt(volts)} V, {_fmt(reported)} A, {_fmt(ohms)} ohm is",
                "consistent with the resistor" if consistent else "not consistent with the resistor",
                _wrongs(
                    "consistent with the resistor" if consistent else "not consistent with the resistor",
                    "consistent with the resistor" if not consistent else "not consistent with the resistor",
                    "proof the solver invented a second source",
                    "a frequency response",
                ),
                "Compare the reported current with V/R before calling the run a measurement.",
                "troubleshooting",
            )
        )
    # 16 interpretation items so far. Add 16 lab-specific procedure faults.
    faults = {
        "ohms-law": [
            ("The ammeter is placed across the resistor like a voltmeter. The reading is", "not the loop current, and the meter may short the source", "the correct resistance", "a valid open-circuit voltage", "tau"),
            ("The report copies V/R into the measured column without a solved current. That cell is", "theoretical, and must not be labeled measured", "a scope sample", "the quiz percentage", "a diode drop"),
        ],
        "series-circuit": [
            ("One lamp in the string is open. The others", "go dark, because there is only one path", "get brighter", "become a parallel pair", "resonate"),
            ("The drops add to less than the source. First check", "a missing element or a reversed sign", "the theme color", "the ripple frequency", "Q"),
        ],
        "parallel-circuit": [
            ("One branch is open. The other branches", "keep their voltage and lose only the open branch's current", "all go dark", "see double voltage", "become series"),
            ("Branch currents add to less than the source current. That means", "a branch is missing from the sum or a meter sign is reversed", "KCL does not apply", "the source is AC by definition", "the bridge is balanced"),
        ],
        "kvl": [
            ("The loop residual is 2 V. The useful conclusion is", "a sign or a missing drop, not a new law", "KVL has failed as a theorem", "the frequency doubled", "the diode is reversed"),
            ("A meter on one element is flipped. That term", "changes sign in the sum", "must be deleted", "becomes a current", "sets fc"),
        ],
        "kcl": [
            ("The node residual is not zero. Check", "every branch current and its sign", "only the wire color", "the resonant frequency", "the LED color"),
            ("A current meter is placed in parallel. It", "does not read the branch current and can short the node", "reads resistance", "nulls a bridge", "measures tau"),
        ],
        "voltage-divider": [
            ("A heavy load on the tap makes Vout", "lower than the unloaded divider prediction", "equal to Vin always", "independent of the load", "a resonant peak"),
            ("The probe is on the top of the divider instead of the tap. It reads", "the source, not the divided output", "zero by definition", "the time constant", "ripple at 2f"),
        ],
        "current-divider": [
            ("The ammeter is in the source lead only. It shows", "the total current, not one branch", "the smaller branch automatically", "Rth", "fc"),
            ("One branch opens. The other branch", "carries the entire source current", "carries nothing", "doubles its resistance", "starts to ring"),
        ],
        "rc-circuit": [
            ("Vc jumps to Vin at once. The resistor is", "bypassed or missing from the charge path", "larger than expected", "setting a longer tau", "the scope ground"),
            ("Tau from the curve is twice RC. Compare", "the R and C in the solved circuit with the values in the formula", "the quiz score", "the diode drop", "the bridge pair"),
        ],
        "rl-circuit": [
            ("Current jumps to V/R immediately. The inductor is", "not in the current path", "larger than the formula", "storing the right energy", "a capacitor"),
            ("vL is still Vin long after several time constants. Current", "never rose, so the path is still open", "has reached V/R", "is resonant", "is rectified"),
        ],
        "rlc-circuit": [
            ("The waveform grows. A passive series R", "cannot supply that growth; the damping term is not the passive R", "must ring forever", "has infinite Q by definition", "is a rectifier"),
            ("Theory says underdamped but the solve is a plain exponential. R is", "above the damping boundary used in the formula", "zero", "negative capacitance", "a short"),
        ],
        "series-resonance": [
            ("The current peak is far from 1/(2π√(LC)). Check", "that the swept L and C are the ones in the formula", "the font of the axis", "the diode drop", "the wiper fraction"),
            ("The marker sits on peak source voltage. Series resonance is", "the peak of loop current, not a peak of the source", "always that marker", "a DC balance", "a charging tau"),
        ],
        "half-wave-rectifier": [
            ("Pulses appear on both half-cycles. The diode is", "shorted or bypassed", "open", "correct", "a capacitor"),
            ("Calling the ripple 100 Hz on a 50 Hz half-wave circuit is", "the full-wave count, not this circuit", "correct", "the cutoff", "Rth"),
        ],
        "full-wave-bridge-rectifier": [
            ("Only one pulse appears per cycle. A diode path is", "open, so one pair never conducts", "the definition of a healthy bridge", "a low-pass", "a potentiometer"),
            ("The reported ripple equals the 50 Hz source. For a healthy bridge it should be", "100 Hz", "50 Hz", "25 Hz", "fc"),
        ],
        "diode-characteristics": [
            ("The V–I plot is a straight line through the origin. The diode is", "shorted, or not in the measured path", "showing its knee", "open", "a capacitor"),
            ("Reverse connection still shows the forward current. The polarity in the netlist is", "not the reverse test you think you ran", "correct for reverse bias", "a Wheatstone null", "a time constant"),
        ],
        "led-circuit": [
            ("The LED stays dark and current is zero with Vs above Vf. Check", "LED polarity and whether the series path is open", "only the chart color", "the resonant frequency", "the wiper"),
            ("The resistor is shorted. LED current is", "no longer limited by (Vs - Vf)/R", "unchanged", "zero by definition", "the cutoff"),
        ],
        "wheatstone-bridge": [
            ("The written ratios match but the detector is not zero. The wired resistors", "are not the values used in the ratio", "must be ignored", "prove KCL is false", "set fc"),
            ("The meter is in series with the source. It reads", "source current, not the balance voltage", "the null", "Rth", "tau"),
        ],
        "potentiometer": [
            ("Turning the shaft does not change Vout. The meter is", "on a fixed end, not the wiper", "correctly on the wiper", "reading ripple", "reading In"),
            ("The bottom end is not at the reference. The bottom stop", "will not read zero", "must read Vin", "sets the resonant frequency", "balances the bridge"),
        ],
        "superposition-theorem": [
            ("The other voltage source was opened instead of shorted. That partial run is", "not the contribution of the remaining source in the original network", "the required deactivation", "Norton's theorem", "a rectifier"),
            ("The lab adds the power of each source. That step is", "not superposition", "required", "how Rth is found", "the cutoff"),
        ],
        "thevenin-theorem": [
            ("Rth was measured with RL still attached. The number is", "not Rth", "exactly Vth", "the load power", "fc"),
            ("Vth was taken with the load connected. It is", "the loaded voltage, smaller than the open-circuit Vth", "the definition of Vth", "In", "tau"),
        ],
        "norton-theorem": [
            ("In was measured with RL still connected. It is", "load current, not the port short current", "exactly In", "Rth", "a diode drop"),
            ("The current source was shorted while finding Rn. It should have been", "opened", "left at its rated current", "replaced by a diode", "swept in frequency"),
        ],
        "maximum-power-transfer": [
            ("The power curve is still rising at the highest RL. The peak is", "outside this sweep unless the sweep crossed Rth", "at the right-hand edge by definition", "at RL = 0", "at infinite Q"),
            ("Rth includes RL. The reported RL = Rth match is", "a match to the wrong resistance", "automatically the maximum", "the cutoff", "the bridge null"),
        ],
        "capacitor-charging": [
            ("Vc is Vin at the first sample. The series resistor is", "bypassed", "doing its job", "equal to tau", "a diode"),
            ("The curve falls instead of rising. The switch state is", "a discharge path, not the charge connection", "the charge connection", "resonance", "a bridge"),
        ],
        "rc-low-pass-filter": [
            ("Channel B is on the source, like channel A. The trace", "cannot show filtering", "is the capacitor voltage", "is the cutoff by definition", "is a DC bridge"),
            ("Gain stays near 1 well above the calculated cutoff. The output probe is", "not on the capacitor", "correct, because low-pass gain never falls", "measuring resistance", "a Thevenin port"),
        ],
    }
    for stem, correct, w1, w2, w3 in faults[experiment_id]:
        items.append(_calc(title, stem, correct, [w1, w2, w3], correct[0].upper() + correct[1:] + ".", "troubleshooting"))
    # Two-step series power checks. Each case uses a different source and split.
    series_cases = [
        (12, 2, 4), (18, 3, 6), (24, 4, 4), (10, 1, 4), (20, 2, 3),
        (15, 3, 2), (30, 5, 5), (16, 2, 6), (21, 3, 4), (9, 1, 2),
        (36, 6, 3), (14, 2, 5), (8, 1, 3), (40, 4, 6),
    ]
    for source, first, second in series_cases:
        total_r = first + second
        current = source / total_r
        power = current * current * first
        items.append(
            _calc(
                title,
                f"A {_fmt(source)} V source feeds {_fmt(first)} ohm then {_fmt(second)} ohm in series. Power in the {_fmt(first)} ohm resistor is",
                f"{_fmt(power)} W",
                _wrongs(
                    f"{_fmt(power)} W",
                    f"{_fmt(source * current)} W",
                    f"{_fmt(current * second)} W",
                    f"{_fmt(source / first)} W",
                ),
                f"I = {_fmt(source)}/{_fmt(total_r)} = {_fmt(current)} A, then P = I²R = {_fmt(power)} W.",
                "troubleshooting",
            )
        )
    if len(items) < 32:
        raise RuntimeError(f"{title} hard {len(items)}")
    return items[:32]


def _build() -> dict[str, list[dict]]:
    bank: dict[str, list[dict]] = {}
    seen: set[str] = set()
    for experiment_id, title in TITLES.items():
        if experiment_id not in EASY_SPECS:
            raise RuntimeError(experiment_id)
        rows = _easy_for(experiment_id) + _medium_special(experiment_id, title) + _hard_for(experiment_id, title)
        if len(rows) != 96:
            raise RuntimeError(f"{experiment_id} produced {len(rows)}")
        dupes: list[str] = []
        for row in rows:
            if row["question"] in seen:
                dupes.append(row["question"])
            seen.add(row["question"])
            if len(row["option_a"]) > 500 or len(row["option_b"]) > 500 or len(row["option_c"]) > 500 or len(row["option_d"]) > 500:
                raise RuntimeError(row["question"])
        if dupes:
            raise RuntimeError("duplicate " + " || ".join(dupes[:8]))
        bank[experiment_id] = rows
    return bank


BAND_FILL = _build()
