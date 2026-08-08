import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, FileText, CalendarClock, BookOpen } from "lucide-react";
import PageNavbar from "./PageNavbar.jsx";
import useCurrentUserRole from "../hooks/useCurrentUserRole";
import "../styles/AppShell.css";

const allNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
  { to: "/courses", label: "Courses", icon: <BookOpen size={18} /> },
  { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
  { to: "/interview", label: "Interview", icon: <CalendarClock size={18} /> },
];

export default function AppShell() {
  const location = useLocation();
  const activePath = location.pathname;
  const { role } = useCurrentUserRole();

  // Interviewers get only Interview link (no Dashboard access)
  let visibleNavItems;
  if (role === "interviewer") {
    visibleNavItems = allNavItems.filter(
      (item) => item.to === "/interview"
    );
  } else {
    // Candidates (or unknown role) get all items
    visibleNavItems = allNavItems;
  }

  // Fallback if role not yet loaded
  if (!role) {
    visibleNavItems = allNavItems;
  }

  return (
    <div className="app-shell">
      <PageNavbar activePath={activePath} navItems={visibleNavItems} />
      <div className="app-shell__content">
        <Outlet />
      </div>
    </div>
  );
}