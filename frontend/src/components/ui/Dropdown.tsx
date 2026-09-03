import { useState, useRef, useEffect, type ReactNode } from "react";

type DropdownItem = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  divider?: boolean;
  disabled?: boolean;
};

type DropdownProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
};

function Dropdown({ trigger, items, align = "left", className = "" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={`ui-dropdown ${className}`} ref={ref}>
      <div className="ui-dropdown-trigger" onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div
          className={`ui-dropdown-menu ui-dropdown-menu-${align} animate-slide-up`}
          role="menu"
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="ui-dropdown-divider" role="separator" />
            ) : (
              <button
                key={i}
                className={`ui-dropdown-item${item.disabled ? " ui-dropdown-item-disabled" : ""}`}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setOpen(false);
                  }
                }}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && <span className="ui-dropdown-item-icon">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
