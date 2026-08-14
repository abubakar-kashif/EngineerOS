import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

type MainLayoutProps = {
  children: ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
};

function MainLayout({
  children,
  currentPage = "home",
  onNavigate,
}: MainLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
      />

      <div className="main-area">
        <Navbar />

        <main className="main-content">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;