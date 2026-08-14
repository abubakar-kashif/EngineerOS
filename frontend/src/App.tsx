import "./App.css";
import { useState } from "react";
import MainLayout from "./component/layout/MainLayout";
import Home from "./pages/Home";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  const pageTitles: Record<string, string> = {
    home: "Home",
    dashboard: "Dashboard",
    experiments: "Experiments",
    tools: "Tools",
    mentor: "AI Mentor",
    quiz: "Quiz",
    reports: "Reports",
    about: "About Us",
    "about us": "About Us",
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {currentPage === "home" && <Home />}

      {currentPage !== "home" && (
        <div className="placeholder-page">
          <h1>
            {pageTitles[currentPage] || currentPage}
          </h1>

          <p>
            This section will be implemented as part of the
            feature development.
          </p>
        </div>
      )}
    </MainLayout>
  );
}

export default App;