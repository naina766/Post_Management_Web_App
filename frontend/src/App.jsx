import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { FiShare2 } from "react-icons/fi";

// Eagerly loaded auth routes for instant initial boot
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Route-level code-splitting with React.lazy
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const EditPost = lazy(() => import("./pages/EditPost"));
const Profile = lazy(() => import("./pages/Profile"));
const Explore = lazy(() => import("./pages/Explore"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SavedPosts = lazy(() => import("./pages/SavedPosts"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Landing = lazy(() => import("./pages/Landing"));

import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import AppNavbar from "./components/Navbar";

function RouteLoadingScreen() {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center py-5 min-vh-50"
      style={{ minHeight: "50vh" }}
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold fs-5">
        <FiShare2 className="heart-pop" /> PostHub
      </div>
      <Spinner animation="border" variant="primary" size="sm" />
    </div>
  );
}

function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <UserProvider>
            <Suspense fallback={<RouteLoadingScreen />}>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                </Route>

                {/* Protected Routes inside Global Authenticated Shell */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AuthenticatedLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create" element={<Navigate to="/create-post" replace />} />
                    <Route path="/create-post" element={<CreatePost />} />
                    <Route path="/edit-post/:id" element={<EditPost />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/saved" element={<SavedPosts />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/creator" element={<Navigate to="/creator-analytics" replace />} />
                    <Route path="/creator-analytics" element={<Analytics />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Fallback redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </UserProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
