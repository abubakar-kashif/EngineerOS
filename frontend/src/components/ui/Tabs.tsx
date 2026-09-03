import { useState, useId, useCallback, type ReactNode } from "react";

type TabsProps = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
};

function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className = "" }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = useCallback(
    (newValue: string) => {
      if (!isControlled) setInternalValue(newValue);
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  const id = useId();

  return (
    <div className={`ui-tabs ${className}`} data-value={value} data-id={id}>
      {typeof children === "function"
        ? (children as (ctx: { value: string; setValue: (v: string) => void; id: string }) => ReactNode)({
            value,
            setValue,
            id,
          })
        : children}
    </div>
  );
}

type TabsListProps = {
  children: ReactNode;
  className?: string;
};

function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <div className={`ui-tabs-list ${className}`} role="tablist">
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

function TabsTrigger({ value, children, disabled, className = "" }: TabsTriggerProps) {
  return (
    <button
      className={`ui-tabs-trigger ${className}`}
      role="tab"
      data-value={value}
      disabled={disabled}
      aria-selected={false}
    >
      {children}
    </button>
  );
}

type TabsContentProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

function TabsContent({ value, children, className = "" }: TabsContentProps) {
  return (
    <div className={`ui-tabs-content ${className}`} role="tabpanel" data-value={value}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
