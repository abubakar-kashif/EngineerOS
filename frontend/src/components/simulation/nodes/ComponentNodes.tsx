/**
 * SVG node renderers for all circuit component types.
 * Each function returns SVG elements positioned at (0, 0) —
 * the parent <g> applies the canvas translation and rotation.
 *
 * Terminals are rendered as interactive circles that respond to
 * click/hover for the wiring system.
 */

// ── Shared terminal dot ──

interface TerminalDotProps {
  x: number;
  y: number;
  id: string;
  connected: boolean;
  active: boolean;
  onMouseDown?: (e: React.MouseEvent, terminalId: string) => void;
  onMouseUp?: (e: React.MouseEvent, terminalId: string) => void;
}

function TerminalDot({ x, y, id, connected, active, onMouseDown, onMouseUp }: TerminalDotProps) {
  return (
    <g className="canvas-terminal" data-terminal-id={id} style={{ cursor: "crosshair" }}>
      {/* Invisible larger hit target for reliable pin picking */}
      <circle
        cx={x}
        cy={y}
        r={12}
        fill="transparent"
        stroke="none"
        onMouseDown={(e) => onMouseDown?.(e, id)}
        onMouseUp={(e) => onMouseUp?.(e, id)}
      />
      <circle
        cx={x}
        cy={y}
        r={active ? 6 : 4}
        fill={active ? "var(--color-primary)" : connected ? "var(--color-text-muted)" : "var(--color-surface)"}
        stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
        strokeWidth={1.5}
        pointerEvents="none"
      />
    </g>
  );
}

// ── Common wrapper ──

interface NodeProps {
  label: string;
  selected: boolean;
  terminals: { id: string; x: number; y: number; connected: boolean }[];
  activeTerminal?: string | null;
  onTerminalMouseDown?: (e: React.MouseEvent, terminalId: string) => void;
  onTerminalMouseUp?: (e: React.MouseEvent, terminalId: string) => void;
  children: React.ReactNode;
}

function NodeWrapper({ label, selected, terminals, activeTerminal, onTerminalMouseDown, onTerminalMouseUp, children }: NodeProps) {
  return (
    <g className={selected ? "canvas-component--selected" : undefined}>
      {selected && (
        <rect
          x={-36}
          y={-36}
          width={72}
          height={72}
          rx={6}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.85}
          pointerEvents="none"
        />
      )}
      {children}
      {/* Reference designator label */}
      <text x={0} y={-28} textAnchor="middle" fontSize={11} fontWeight={600}
        fill={selected ? "var(--color-primary)" : "var(--color-text)"}>
        {label}
      </text>
      {/* Terminal dots */}
      {terminals.map((t) => (
        <TerminalDot
          key={t.id}
          x={t.x} y={t.y}
          id={t.id}
          connected={t.connected}
          active={activeTerminal === t.id}
          onMouseDown={onTerminalMouseDown}
          onMouseUp={onTerminalMouseUp}
        />
      ))}
    </g>
  );
}

// ── Wire style helper ──

const WIRE_STYLE = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// ── Individual component renderers ──

export function VoltageSourceNode(props: Omit<NodeProps, "children"> & { voltage?: string }) {
  return (
    <NodeWrapper {...props}>
      {/* Battery plates: long = positive, short = negative */}
      <line x1={0} y1={-20} x2={0} y2={-8} {...WIRE_STYLE} />
      <line x1={-12} y1={-8} x2={12} y2={-8} {...WIRE_STYLE} strokeWidth={2} />
      <line x1={-7} y1={-2} x2={7} y2={-2} {...WIRE_STYLE} strokeWidth={2} />
      <line x1={0} y1={-2} x2={0} y2={20} {...WIRE_STYLE} />
      {/* Polarity */}
      <text x={16} y={-6} fontSize={10} fill="currentColor">+</text>
      <text x={16} y={3} fontSize={12} fill="currentColor">−</text>
      {props.voltage && (
        <text x={-20} y={2} textAnchor="end" fontSize={10} fill="var(--color-text-secondary)">{props.voltage}</text>
      )}
    </NodeWrapper>
  );
}

export function CurrentSourceNode(props: Omit<NodeProps, "children"> & { currentValue?: string }) {
  return (
    <NodeWrapper {...props}>
      <line x1={0} y1={-20} x2={0} y2={-10} {...WIRE_STYLE} />
      <circle cx={0} cy={0} r={10} stroke="currentColor" strokeWidth={1.5} fill="none" />
      {/* Arrow inside circle */}
      <line x1={0} y1={6} x2={0} y2={-6} strokeWidth={1.5} stroke="currentColor" />
      <polygon points="0,-6 -3,-2 3,-2" fill="currentColor" />
      <line x1={0} y1={10} x2={0} y2={20} {...WIRE_STYLE} />
      {props.currentValue && (
        <text x={-20} y={4} textAnchor="end" fontSize={10} fill="var(--color-text-secondary)">{props.currentValue}</text>
      )}
    </NodeWrapper>
  );
}

export function ResistorNode(props: Omit<NodeProps, "children"> & { value?: string }) {
  // Zigzag pattern (horizontal, width 60)
  const zigzag = "M-30,0 L-22,0 L-18,-8 L-10,0 L-2,8 L6,0 L14,-8 L22,0 L30,0";
  return (
    <NodeWrapper {...props}>
      <path d={zigzag} {...WIRE_STYLE} />
      {props.value && (
        <text x={0} y={18} textAnchor="middle" fontSize={10} fill="var(--color-text-secondary)">{props.value}</text>
      )}
    </NodeWrapper>
  );
}

export function CapacitorNode(props: Omit<NodeProps, "children"> & { value?: string }) {
  return (
    <NodeWrapper {...props}>
      <line x1={-20} y1={0} x2={-4} y2={0} {...WIRE_STYLE} />
      <line x1={-4} y1={-12} x2={-4} y2={12} {...WIRE_STYLE} />
      <line x1={4} y1={-12} x2={4} y2={12} {...WIRE_STYLE} />
      <line x1={4} y1={0} x2={20} y2={0} {...WIRE_STYLE} />
      {props.value && (
        <text x={0} y={22} textAnchor="middle" fontSize={10} fill="var(--color-text-secondary)">{props.value}</text>
      )}
    </NodeWrapper>
  );
}

export function InductorNode(props: Omit<NodeProps, "children"> & { value?: string }) {
  // Coil bumps
  const bumps = "M-30,0 L-22,0 A4,4 0 0,1 -14,0 A4,4 0 0,1 -6,0 A4,4 0 0,1 2,0 A4,4 0 0,1 10,0 A4,4 0 0,1 18,0 A4,4 0 0,1 26,0 L30,0";
  return (
    <NodeWrapper {...props}>
      <path d={bumps} {...WIRE_STYLE} />
      {props.value && (
        <text x={0} y={18} textAnchor="middle" fontSize={10} fill="var(--color-text-secondary)">{props.value}</text>
      )}
    </NodeWrapper>
  );
}

export function DiodeNode(props: Omit<NodeProps, "children"> & { value?: string; state?: string }) {
  const isForward = props.state === "forward";
  return (
    <NodeWrapper {...props}>
      <line x1={-20} y1={0} x2={-6} y2={0} {...WIRE_STYLE} />
      {/* Triangle */}
      <polygon points="-6,-8 -6,8 8,0" fill={isForward ? "var(--color-primary)" : "currentColor"} opacity={isForward ? 0.3 : 1} />
      {/* Bar */}
      <line x1={8} y1={-8} x2={8} y2={8} {...WIRE_STYLE} />
      <line x1={8} y1={0} x2={20} y2={0} {...WIRE_STYLE} />
      {props.value && (
        <text x={0} y={-16} textAnchor="middle" fontSize={10} fill="var(--color-text-secondary)">{props.value}</text>
      )}
    </NodeWrapper>
  );
}

export function LEDNode(props: Omit<NodeProps, "children"> & { value?: string; state?: string; color?: string }) {
  const isOn = props.state === "on";
  const ledColor = isOn ? (props.color || "#ff3333") : "currentColor";
  return (
    <NodeWrapper {...props}>
      <line x1={-20} y1={0} x2={-6} y2={0} {...WIRE_STYLE} />
      <polygon points="-6,-8 -6,8 8,0" fill={isOn ? ledColor : "none"} stroke={ledColor} strokeWidth={1.5} />
      <line x1={8} y1={-8} x2={8} y2={8} stroke={ledColor} strokeWidth={1.5} />
      <line x1={8} y1={0} x2={20} y2={0} {...WIRE_STYLE} />
      {/* Emission arrows */}
      <line x1={6} y1={-14} x2={14} y2={-22} strokeWidth={1.2} stroke={ledColor} />
      <polygon points="14,-22 10,-20 12,-16" fill={ledColor} />
      <line x1={12} y1={-10} x2={20} y2={-18} strokeWidth={1.2} stroke={ledColor} />
      <polygon points="20,-18 16,-16 18,-12" fill={ledColor} />
      {/* Glow effect when ON */}
      {isOn && <circle cx={0} cy={0} r={16} fill={ledColor} opacity={0.15} />}
      {props.value && (
        <text x={0} y={22} textAnchor="middle" fontSize={10} fill="var(--color-text-secondary)">{props.value}</text>
      )}
    </NodeWrapper>
  );
}

export function SwitchNode(props: Omit<NodeProps, "children"> & { closed?: boolean }) {
  const closed = props.closed ?? false;
  return (
    <NodeWrapper {...props}>
      <line x1={-20} y1={0} x2={-6} y2={0} {...WIRE_STYLE} />
      <circle cx={-6} cy={0} r={2.5} fill="currentColor" />
      <line x1={-6} y1={0} x2={6} y2={closed ? 0 : -12} {...WIRE_STYLE} />
      <circle cx={6} cy={0} r={2.5} fill="currentColor" />
      <line x1={6} y1={0} x2={20} y2={0} {...WIRE_STYLE} />
      <text x={0} y={closed ? 18 : -20} textAnchor="middle" fontSize={9}
        fill={closed ? "var(--color-success)" : "var(--color-danger)"}>
        {closed ? "CLOSED" : "OPEN"}
      </text>
    </NodeWrapper>
  );
}

export function GroundNode(props: Omit<NodeProps, "children">) {
  return (
    <NodeWrapper {...props}>
      <line x1={0} y1={-15} x2={0} y2={0} {...WIRE_STYLE} />
      <line x1={-10} y1={0} x2={10} y2={0} {...WIRE_STYLE} />
      <line x1={-6} y1={5} x2={6} y2={5} {...WIRE_STYLE} />
      <line x1={-3} y1={10} x2={3} y2={10} {...WIRE_STYLE} />
    </NodeWrapper>
  );
}

export function VoltmeterNode(props: Omit<NodeProps, "children"> & { reading?: string }) {
  return (
    <NodeWrapper {...props}>
      <line x1={-20} y1={0} x2={-12} y2={0} {...WIRE_STYLE} />
      <circle cx={0} cy={0} r={12} stroke="currentColor" strokeWidth={1.5} fill="none" />
      <text x={0} y={4} textAnchor="middle" fontSize={12} fontWeight={600} fill="currentColor">V</text>
      <line x1={12} y1={0} x2={20} y2={0} {...WIRE_STYLE} />
      {props.reading && (
        <text x={0} y={22} textAnchor="middle" fontSize={10} fill="var(--color-primary)">{props.reading}</text>
      )}
    </NodeWrapper>
  );
}

export function AmmeterNode(props: Omit<NodeProps, "children"> & { reading?: string }) {
  return (
    <NodeWrapper {...props}>
      <line x1={-20} y1={0} x2={-12} y2={0} {...WIRE_STYLE} />
      <circle cx={0} cy={0} r={12} stroke="currentColor" strokeWidth={1.5} fill="none" />
      <text x={0} y={4} textAnchor="middle" fontSize={12} fontWeight={600} fill="currentColor">A</text>
      <line x1={12} y1={0} x2={20} y2={0} {...WIRE_STYLE} />
      {props.reading && (
        <text x={0} y={22} textAnchor="middle" fontSize={10} fill="var(--color-primary)">{props.reading}</text>
      )}
    </NodeWrapper>
  );
}

// ── Junction marker ──

export function JunctionMarker({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={3.5} fill="currentColor" className="canvas-junction" />;
}
