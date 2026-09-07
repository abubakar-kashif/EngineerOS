import "./App.css";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthProvider";
import { ThemeProvider } from "./components/ui/ThemeProvider";
import ToastProvider from "./components/ui/ToastProvider";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
