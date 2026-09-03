import { useId, forwardRef, type SelectHTMLAttributes } from "react";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  label?: string;
  description?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  wrapperClassName?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, description, error, placeholder, options, wrapperClassName = "", id: externalId, ...rest }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;

    return (
      <div className={`ui-field ${wrapperClassName}`}>
        {label && (
          <label htmlFor={id} className="ui-field-label">
            {label}
          </label>
        )}
        {description && <p className="ui-field-description">{description}</p>}
        <div className={`ui-select-wrapper${error ? " ui-select-error" : ""}${rest.disabled ? " ui-select-disabled" : ""}`}>
          <select
            ref={ref}
            id={id}
            className="ui-select"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="ui-select-chevron" aria-hidden="true">
            ▾
          </span>
        </div>
        {error && (
          <p id={`${id}-error`} className="ui-field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
