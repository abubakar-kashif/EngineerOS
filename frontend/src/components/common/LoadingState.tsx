import Spinner from "../ui/Spinner";

type LoadingStateProps = {
  message?: string;
};

function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="state-container" role="status">
      <Spinner size="lg" />
      <p className="state-description">{message}</p>
    </div>
  );
}

export default LoadingState;
