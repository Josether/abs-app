"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./components/sidebar";
import { Topbar } from "./components/topbar";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import { DevicesPage } from "./pages/devices";
import { UsersPage } from "./pages/users";
import { SchedulesPage } from "./pages/schedules";
import { JobsPage } from "./pages/jobs";
import { BackupsPage } from "./pages/backups";
import { AuditLogsPage } from "./pages/audit-logs";
import { Toaster } from "sonner";

export default function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<
    { username: string; role: "admin" | "viewer" } | null
  >(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("abs_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setCurrentPage("dashboard");
    }
  }, []);

  const handleLogin = (username: string, role: "admin" | "viewer") => {
    const user = { username, role };
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem("abs_user", JSON.stringify(user));
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("abs_user");
    setCurrentPage("login");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "devices":
        return <DevicesPage />;
      case "users":
        return <UsersPage />;
      case "schedules":
        return <SchedulesPage />;
      case "jobs":
        return <JobsPage />;
      case "backups":
        return <BackupsPage />;
      case "audit-logs":
        return <AuditLogsPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          userRole={currentUser?.role || "viewer"}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar
            username={currentUser?.username || ""}
            role={currentUser?.role || "viewer"}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-auto p-6">{renderPage()}</main>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
