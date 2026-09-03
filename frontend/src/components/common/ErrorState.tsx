import ErrorStateUI from "../ui/ErrorState";

type ErrorStateProps = {
  message?: string;
};

function ErrorState({ message = "Something went wrong." }: ErrorStateProps) {
  return <ErrorStateUI title={message} />;
}

export default ErrorState;
