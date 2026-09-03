import EngineerOSMark from "../branding/EngineerOSMark";

function AppLoadingScreen() {
  return (
    <div className="app-loading-screen">
      <div className="app-loading-content animate-fade">
        <EngineerOSMark size="lg" />
        <p className="app-loading-text">Preparing your workspace...</p>
      </div>
    </div>
  );
}

export default AppLoadingScreen;
