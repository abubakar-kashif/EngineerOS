import { useId, forwardRef, type TextareaHTMLAttributes } from "react";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  label?: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
  maxLength?: number;
  showCount?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, description, error, wrapperClassName = "", maxLength, showCount, value, id: externalId, ...rest }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className={`ui-field ${wrapperClassName}`}>
        {label && (
          <label htmlFor={id} className="ui-field-label">
            {label}
          </label>
        )}
        {description && <p className="ui-field-description">{description}</p>}
        <textarea
          ref={ref}
          id={id}
          className={`ui-textarea${error ? " ui-textarea-error" : ""}${rest.disabled ? " ui-textarea-disabled" : ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          maxLength={maxLength}
          value={value}
          {...rest}
        />
        <div className="ui-textarea-footer">
          {error && (
            <p id={`${id}-error`} className="ui-field-error" role="alert">
              {error}
            </p>
          )}
          {showCount && maxLength && (
            <span className="ui-field-count">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
