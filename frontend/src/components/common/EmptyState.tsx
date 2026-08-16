type EmptyStateProps = {
  message?: string;
};

function EmptyState({
  message = "No results found.",
}: EmptyStateProps) {
  return (
    <div className="state-container">
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;