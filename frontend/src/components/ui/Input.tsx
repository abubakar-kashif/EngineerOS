import { useState, useId, forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label?: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
  icon?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, description, error, wrapperClassName = "", icon, type, id: externalId, ...rest }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className={`ui-field ${wrapperClassName}`}>
        {label && (
          <label htmlFor={id} className="ui-field-label">
            {label}
          </label>
        )}
        {description && <p className="ui-field-description">{description}</p>}
        <div className={`ui-input-wrapper${error ? " ui-input-error" : ""}${rest.disabled ? " ui-input-disabled" : ""}`}>
          {icon && <span className="ui-input-icon">{icon}</span>}
          <input
            ref={ref}
            id={id}
            type={inputType}
            className={`ui-input${icon ? " ui-input-with-icon" : ""}${isPassword ? " ui-input-with-action" : ""}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              className="ui-input-action"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
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

Input.displayName = "Input";
export default Input;
