import EmptyStateUI from "../ui/EmptyState";

type EmptyStateProps = {
  message?: string;
};

function EmptyState({ message = "No results found." }: EmptyStateProps) {
  return <EmptyStateUI description={message} />;
}

export default EmptyState;
