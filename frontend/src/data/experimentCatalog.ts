/** User-facing experiment ids. The catalog length is the product count. */
export const CATALOG_EXPERIMENT_IDS = [
  "ohms-law",
  "series-circuit",
  "parallel-circuit",
  "kvl",
  "kcl",
  "voltage-divider",
  "current-divider",
  "rc-circuit",
  "rl-circuit",
  "rlc-circuit",
  "series-resonance",
  "half-wave-rectifier",
  "full-wave-bridge-rectifier",
  "diode-characteristics",
  "led-circuit",
  "wheatstone-bridge",
  "potentiometer",
  "superposition-theorem",
  "thevenin-theorem",
  "norton-theorem",
  "maximum-power-transfer",
  "capacitor-charging",
  "rc-low-pass-filter",
] as const;

export const CATALOG_EXPERIMENT_COUNT = CATALOG_EXPERIMENT_IDS.length;
