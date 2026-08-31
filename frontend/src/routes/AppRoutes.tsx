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
import SimulationPage from "../pages/SimulationPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Experiments */}
        <Route path="/experiments" element={<ExperimentsPage />} />

        <Route
          path="/experiments/:experimentId"
          element={<ExperimentDetailsPage />}
        />

        <Route
          path="/experiments/:experimentId/workspace"
          element={<WorkspacePage />}
        />

        {/* AI Mentor */}
        <Route path="/mentor" element={<MentorPage />} />

        {/* Quiz */}
        <Route
          path="/quiz/:experimentId"
          element={<QuizPage />}
        />

        {/* Reports */}
        <Route path="/reports" element={<ReportsPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Tools */}
        <Route path="/tools" element={<ToolsPage />} />

        {/* Simulation */}
        <Route
          path="/simulation"
          element={<SimulationPage />}
        />

        {/* About */}
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;