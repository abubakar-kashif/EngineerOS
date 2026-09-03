type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Announced to screen readers; keep it specific, e.g. "Quiz result emails". */
  label: string;
  disabled?: boolean;
};

/** Accessible on/off switch used across the settings pages. */
function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`ui-toggle${checked ? " ui-toggle-on" : ""}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-toggle-thumb" aria-hidden="true" />
    </button>
  );
}

export default Toggle;
