import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import HomePage from "../pages/HomePage";
import ExperimentsPage from "../pages/ExperimentsPage";
import ExperimentDetailsPage from "../pages/ExperimentDetailsPage";
import WorkspacePage from "../pages/WorkspacePage";
import MentorPage from "../pages/MentorPage";
import QuizPage from "../pages/quiz/QuizPage";
import QuizResultPage from "../pages/quiz/QuizResultPage";
import ReportsPage from "../pages/reports/ReportsPage";
import ReportDetailsPage from "../pages/reports/ReportDetailsPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ResourcesPage from "../pages/resources/ResourcesPage";
import ToolsPage from "../pages/tools/ToolsPage";
import CalculatorPage from "../pages/tools/CalculatorPage";
import UnitConverterPage from "../pages/tools/UnitConverterPage";
import FormulaReferencePage from "../pages/tools/FormulaReferencePage";
import AboutPage from "../pages/AboutPage";
import SimulationPage from "../pages/SimulationPage";
import EngineeringCalculatorsPage from "../pages/tools/EngineeringCalculatorsPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyPage from "../pages/auth/VerifyPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

import SettingsPage from "../pages/settings/SettingsPage";
import AppearanceSettings from "../pages/settings/AppearanceSettings";
import AccountSettings from "../pages/settings/AccountSettings";
import PreferencesSettings from "../pages/settings/PreferencesSettings";
import NotificationSettings from "../pages/settings/NotificationSettings";
import SecuritySettings from "../pages/settings/SecuritySettings";

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes (no shell) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected app routes (with shell) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/experiments" element={<ExperimentsPage />} />
        <Route path="/experiments/:experimentId" element={<ExperimentDetailsPage />} />
        <Route path="/experiments/:experimentId/workspace" element={<WorkspacePage />} />
        <Route path="/mentor" element={<MentorPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/:experimentId" element={<QuizPage />} />
        <Route path="/quiz/:experimentId/result" element={<QuizResultPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:reportId" element={<ReportDetailsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/calculator" element={<CalculatorPage />} />
        <Route path="/tools/engineering-calculators" element={<EngineeringCalculatorsPage />} />
        <Route path="/tools/unit-converter" element={<UnitConverterPage />} />
        <Route path="/tools/formulas" element={<FormulaReferencePage />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Settings with nested routes */}
        <Route path="/settings" element={<SettingsPage />}>
          <Route index element={<AppearanceSettings />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="preferences" element={<PreferencesSettings />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="security" element={<SecuritySettings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
