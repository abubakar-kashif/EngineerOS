type ErrorStateProps = {
  title?: string;
  description?: string;
  retryAction?: () => void;
  retryLabel?: string;
  className?: string;
};

function ErrorState({
  title = "Something went wrong",
  description,
  retryAction,
  retryLabel = "Try again",
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`state-container ${className}`} role="alert">
      <h3 className="state-title">{title}</h3>
      {description && <p className="state-description">{description}</p>}
      {retryAction && (
        <div className="state-action">
          <button type="button" className="ui-button ui-button-primary" onClick={retryAction}>
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
