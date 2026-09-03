/**
 * Resources service.
 *
 * API-first: loads GET /api/resources and maps the backend type to a
 * client-side category. The backend currently seeds four records without
 * URLs, so known ids are enriched with curated links to keep every card
 * actionable. When the API is unavailable, a curated library of real
 * electrical engineering resources is served instead.
 */
import { apiRequest } from "../api";
import type { ApiResource, Resource } from "../../types/resources";
import { RESOURCE_TYPE_TO_CATEGORY } from "../../types/resources";

interface ApiResourceListResponse {
  items: ApiResource[];
  total: number;
}

/**
 * Working links for the backend-seeded resources (which have url=None),
 * keyed by resource id.
 */
const API_URL_OVERRIDES: Record<string, string> = {
  "ohms-law-notes": "https://www.allaboutcircuits.com/textbook/direct-current/chpt-2/voltage-current-resistance-relate/",
  "series-circuit-notes": "https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/what-are-series-and-parallel-circuits/",
  "kvl-kcl-reference": "https://en.wikipedia.org/wiki/Kirchhoff%27s_circuit_laws",
  "electrical-formulas": "https://www.electronics-tutorials.ws/dcp/dcp_2.html",
};

/** Curated library served when the backend is unavailable. */
const RESOURCE_LIBRARY: Resource[] = [
  {
    id: "all-about-circuits",
    title: "All About Circuits — DC/AC Textbook",
    description:
      "Free open-source textbook covering direct and alternating current circuit theory from fundamentals to advanced analysis.",
    category: "learning",
    type: "tutorial",
    url: "https://www.allaboutcircuits.com/textbook/",
    source: "seed",
  },
  {
    id: "khan-academy-ee",
    title: "Khan Academy — Electrical Engineering",
    description:
      "Structured video lessons on circuit analysis, amplifiers, semiconductors and more, with practice exercises.",
    category: "learning",
    type: "video",
    url: "https://www.khanacademy.org/science/electrical-engineering",
    source: "seed",
  },
  {
    id: "electronics-tutorials",
    title: "Electronics Tutorials",
    description:
      "Clear reference tutorials on DC/AC theory, resistors, capacitors, inductors and semiconductor devices.",
    category: "learning",
    type: "tutorial",
    url: "https://www.electronics-tutorials.ws/",
    source: "seed",
  },
  {
    id: "ohms-law-wikipedia",
    title: "Ohm's Law Reference",
    description:
      "Definition, history and worked examples of the voltage–current–resistance relationship.",
    category: "reference",
    type: "reference",
    url: "https://en.wikipedia.org/wiki/Ohm%27s_law",
    source: "seed",
  },
  {
    id: "kirchhoff-laws",
    title: "Kirchhoff's Circuit Laws",
    description:
      "KVL and KCL explained with sign conventions and mesh/nodal analysis examples.",
    category: "reference",
    type: "reference",
    url: "https://en.wikipedia.org/wiki/Kirchhoff%27s_circuit_laws",
    source: "seed",
  },
  {
    id: "ee-units-reference",
    title: "SI Units for Electrical Engineering",
    description:
      "Quick reference for volts, amperes, ohms, watts and their SI prefixes.",
    category: "reference",
    type: "reference",
    url: "https://www.nist.gov/pml/owm/metric-si/si-units",
    source: "seed",
  },
  {
    id: "falstad-simulator",
    title: "Falstad Circuit Simulator",
    description:
      "Interactive browser simulator with animated current flow — great for building intuition fast.",
    category: "simulation",
    type: "simulation",
    url: "https://www.falstad.com/circuit/",
    source: "seed",
  },
  {
    id: "ltspice",
    title: "LTspice",
    description:
      "Industry-standard free SPICE simulator from Analog Devices for serious transient and AC analysis.",
    category: "simulation",
    type: "tool",
    url: "https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html",
    source: "seed",
  },
  {
    id: "tinkercad-circuits",
    title: "Tinkercad Circuits",
    description:
      "Beginner-friendly browser simulator that pairs Arduino and breadboarding with virtual components.",
    category: "simulation",
    type: "simulation",
    url: "https://www.tinkercad.com/circuits",
    source: "seed",
  },
  {
    id: "rapidtables-ohm",
    title: "RapidTables — Ohm's Law Calculator",
    description:
      "Solve for voltage, current, resistance or power with instant unit-aware results.",
    category: "tools",
    type: "calculator",
    url: "https://www.rapidtables.com/calc/electric/ohms-law-calculator.html",
    source: "seed",
  },
  {
    id: "eeweb-tools",
    title: "EEWeb Engineering Calculators",
    description:
      "Resistor color codes, voltage dividers, trace widths and dozens more EE calculators.",
    category: "tools",
    type: "calculator",
    url: "https://www.eeweb.com/tools/",
    source: "seed",
  },
  {
    id: "resistor-calculator",
    title: "Resistor Color Code Calculator",
    description:
      "Decode 4- and 5-band resistor color codes instantly while you build.",
    category: "tools",
    type: "calculator",
    url: "https://www.digikey.com/en/resources/conversion-calculators/conversion-calculator-resistor-color-code",
    source: "seed",
  },
  {
    id: "lcsc-datasheets",
    title: "LCSC Electronics",
    description:
      "Component distributor with free datasheets and specs for millions of electronic parts.",
    category: "datasheets",
    type: "datasheet",
    url: "https://www.lcsc.com/",
    source: "seed",
  },
  {
    id: "alldatasheet",
    title: "AllDatasheet",
    description:
      "Searchable archive of component datasheets from virtually every semiconductor manufacturer.",
    category: "datasheets",
    type: "datasheet",
    url: "https://www.alldatasheet.com/",
    source: "seed",
  },
  {
    id: "octopart",
    title: "Octopart",
    description:
      "Part search engine that compares stock, pricing and datasheets across distributors.",
    category: "datasheets",
    type: "datasheet",
    url: "https://octopart.com/",
    source: "seed",
  },
  {
    id: "arduino-docs",
    title: "Arduino Documentation",
    description:
      "Official language reference, built-in examples and board guides for Arduino prototyping.",
    category: "documentation",
    type: "documentation",
    url: "https://docs.arduino.cc/",
    source: "seed",
  },
  {
    id: "kicad-docs",
    title: "KiCad Documentation",
    description:
      "Manuals and tutorials for the open-source PCB design suite used in universities worldwide.",
    category: "documentation",
    type: "documentation",
    url: "https://docs.kicad.org/",
    source: "seed",
  },
  {
    id: "sparkfun-learn",
    title: "SparkFun Learn",
    description:
      "Hands-on tutorials and hookup guides for sensors, motors and classic beginner electronics kits.",
    category: "documentation",
    type: "guide",
    url: "https://learn.sparkfun.com/",
    source: "seed",
  },
];

function categoryForType(type: string): Resource["category"] {
  return RESOURCE_TYPE_TO_CATEGORY[type.toLowerCase()] ?? "reference";
}

function normalizeApiResource(raw: ApiResource): Resource {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    category: categoryForType(raw.type),
    type: raw.type,
    url: raw.url ?? API_URL_OVERRIDES[raw.id] ?? null,
    source: "api",
  };
}

/**
 * Loads resources, preferring the backend. Backend items come first
 * (enriched with curated links when the record has no URL), followed by
 * curated library entries that the backend does not cover.
 */
export async function getResources(): Promise<Resource[]> {
  let apiItems: Resource[] = [];

  try {
    const response = await apiRequest<ApiResourceListResponse>("/resources");
    if (Array.isArray(response.items)) {
      apiItems = response.items.map(normalizeApiResource);
    }
  } catch {
    // Backend unavailable — the curated library carries the page.
  }

  const seen = new Set(apiItems.map((resource) => resource.id));
  const extras = RESOURCE_LIBRARY.filter((resource) => !seen.has(resource.id));

  const merged = [...apiItems, ...extras];
  merged.sort((a, b) => a.title.localeCompare(b.title));
  return merged;
}

/** Loads a single resource by id from the merged catalog. */
export async function getResourceById(resourceId: string): Promise<Resource | undefined> {
  const resources = await getResources();
  return resources.find((resource) => resource.id === resourceId);
}
