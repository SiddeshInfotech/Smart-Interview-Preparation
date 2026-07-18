import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, FileText, CalendarClock } from "lucide-react";
import PageNavbar from "./PageNavbar.jsx";
import useCurrentUserRole from "../hooks/useCurrentUserRole";
import "../styles/AppShell.css";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
  { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
  { to: "/interview", label: "Interview", icon: <CalendarClock size={18} /> },
];

export default function AppShell() {
  const location = useLocation();
  const activePath = location.pathname;
  const { role } = useCurrentUserRole();

  const visibleNavItems =
    role === "interviewer"
      ? navItems.filter((item) => item.to !== "/quiz" && item.to !== "/interview")
      : navItems;

  return (
    <div className="app-shell">
      <PageNavbar activePath={activePath} navItems={visibleNavItems} />
      <div className="app-shell__content">
        <Outlet />
      </div>
    </div>
  );
}
