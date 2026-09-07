/**
 * Legacy workspace route — redirects into the common freeform simulation lab.
 * Keeps deep links `/experiments/:id/workspace` working for all ten experiments.
 */
import { Navigate, useParams } from "react-router-dom";

function WorkspacePage() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const qs = experimentId
    ? `?experiment=${encodeURIComponent(experimentId)}`
    : "";
  return <Navigate to={`/simulation${qs}`} replace />;
}

export default WorkspacePage;
