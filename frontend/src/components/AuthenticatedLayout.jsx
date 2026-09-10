import React from "react";
import { Outlet } from "react-router-dom";
import AppNavbar from "./Navbar";
import { LeftSidebar } from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AuthenticatedLayout() {
  return (
    <div className="d-flex flex-column min-vh-100 pb-5 pb-lg-0">
      <AppNavbar />
      <div className="posthub-app-shell">
        <aside className="posthub-sidebar-col d-none d-lg-block">
          <LeftSidebar />
        </aside>
        <main className="posthub-page-content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
