type LoadingStateProps = {
  message?: string;
};

function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="state-container" role="status">
      <p>{message}</p>
    </div>
  );
}

export default LoadingState;