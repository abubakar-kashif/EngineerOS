type ErrorStateProps = {
  message?: string;
};

function ErrorState({
  message = "Something went wrong.",
}: ErrorStateProps) {
  return (
    <div className="state-container" role="alert">
      <p>{message}</p>
    </div>
  );
}

export default ErrorState;