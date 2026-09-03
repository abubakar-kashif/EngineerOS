import { useState, useRef, useId, type ReactNode } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  content: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  children: ReactNode;
  className?: string;
};

function Tooltip({ content, position = "top", delay = 200, children, className = "" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <span
      className={`ui-tooltip-wrapper ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={visible ? id : undefined}
    >
      {children}
      {visible && (
        <span
          id={id}
          className={`ui-tooltip ui-tooltip-${position} animate-fade`}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  );
}

export default Tooltip;
