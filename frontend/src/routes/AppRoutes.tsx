import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";

import HomePage from "../pages/HomePage";
import ExperimentsPage from "../pages/ExperimentsPage";
import ExperimentDetailsPage from "../pages/ExperimentDetailsPage";
import WorkspacePage from "../pages/WorkspacePage";
import MentorPage from "../pages/MentorPage";
import QuizPage from "../pages/QuizPage";
import ReportsPage from "../pages/ReportsPage";
import DashboardPage from "../pages/DashboardPage";
import ToolsPage from "../pages/ToolsPage";
import AboutPage from "../pages/AboutPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/experiments" element={<ExperimentsPage />} />

        <Route
          path="/experiments/:experimentId"
          element={<ExperimentDetailsPage />}
        />

        <Route
          path="/experiments/:experimentId/workspace"
          element={<WorkspacePage />}
        />

        <Route path="/mentor" element={<MentorPage />} />

        <Route path="/quiz/:experimentId" element={<QuizPage />} />

        <Route path="/reports" element={<ReportsPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/tools" element={<ToolsPage />} />

        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;