import "./App.css";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthProvider";
import { ThemeProvider } from "./components/ui/ThemeProvider";
import ToastProvider from "./components/ui/ToastProvider";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
