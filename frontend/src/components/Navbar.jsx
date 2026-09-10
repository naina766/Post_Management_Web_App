import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Navbar, Container, Button, Badge } from "react-bootstrap";
import {
  FiShare2,
  FiFileText,
  FiCompass,
  FiBookmark,
  FiBell,
  FiBarChart2,
  FiShield,
  FiPlusSquare,
  FiUser,
  FiLogOut,
  FiSun,
  FiMoon,
  FiSettings,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { getUnreadCount } from "../services/notifications";
import { getInitials } from "../utils/initials";

export default function AppNavbar() {
  const { user, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navSearch, setNavSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/explore?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch("");
      setExpanded(false);
      setDrawerOpen(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount();
        if (isMounted) {
          setUnreadCount(res.data.data?.unreadCount || 0);
        }
      } catch {
        // Silently ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };

    document.body.classList.add("drawer-open");
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("drawer-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    setExpanded(false);
    setDrawerOpen(false);
    navigate("/login");
  };

  const handleNavClick = () => {
    setExpanded(false);
    setDrawerOpen(false);
  };

  const isAdminOrMod = user && ["admin", "moderator"].includes(user.role);

  return (
    <>
      <Navbar
        expanded={expanded}
        onToggle={setExpanded}
        expand="lg"
        className="posthub-navbar sticky-top"
      >
        <Container fluid="xl">
          <Navbar.Brand
            as={Link}
            to={user ? "/dashboard" : "/"}
            onClick={handleNavClick}
            className="posthub-brand d-flex align-items-center gap-2 flex-shrink-0"
          >
            <FiShare2 className="brand-icon" aria-hidden="true" />
            <span>PostHub</span>
          </Navbar.Brand>

          <form
            onSubmit={handleSearchSubmit}
            className="nav-search-form d-none d-md-flex align-items-center ms-3 ms-xl-4 me-3"
            role="search"
          >
            <div className="ph-navbar-search">
              <FiSearch
                className="ph-navbar-search-icon"
                size={16}
                aria-hidden="true"
              />
              <input
                type="text"
                role="searchbox"
                className="form-control nav-search-input"
                placeholder="Search creators, #tags..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                aria-label="Search PostHub"
              />
              {navSearch && (
                <button
                  type="button"
                  className="ph-navbar-search-clear"
                  onClick={() => setNavSearch("")}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <FiX size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </form>

          <div className="d-flex align-items-center gap-2 d-lg-none ms-auto">
            {user && (
              <Link
                to="/notifications"
                onClick={handleNavClick}
                className="nav-icon-btn"
                aria-label="Open notifications"
                title="Open notifications"
              >
                <FiBell size={18} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="badge-notification-dot" aria-hidden="true"></span>
                )}
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
              aria-label="Toggle theme"
              type="button"
            >
              {theme === "light" ? (
                <FiMoon size={16} aria-hidden="true" />
              ) : (
                <FiSun size={16} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="nav-icon-btn text-body"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="d-none d-lg-flex align-items-center gap-2 ms-auto flex-shrink-0">
            {user && (
              <Link
                to="/notifications"
                className="nav-icon-btn"
                title="Open notifications"
                aria-label="Open notifications"
              >
                <FiBell size={18} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="badge-notification-dot" aria-hidden="true"></span>
                )}
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
              aria-label="Toggle theme"
              type="button"
            >
              {theme === "light" ? (
                <FiMoon size={16} aria-hidden="true" />
              ) : (
                <FiSun size={16} aria-hidden="true" />
              )}
            </button>

            {user ? (
              <>
                <Button
                  as={Link}
                  to="/create-post"
                  className="nav-create-btn text-nowrap"
                  title="Create a new post"
                  aria-label="Create post"
                >
                  <FiPlusSquare size={15} aria-hidden="true" />
                  <span>Create Post</span>
                </Button>

                <Link
                  to={`/profile/${user.username || ""}`}
                  className="d-flex align-items-center gap-2 user-nav-profile-pill text-decoration-none text-body text-nowrap"
                  title="View profile"
                  aria-label="View profile"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="rounded-circle object-fit-cover"
                      style={{ width: "34px", height: "34px" }}
                      onError={(e) => {
                        e.currentTarget.dataset.broken = "true";
                      }}
                    />
                  ) : (
                    <div
                      className="post-author-avatar rounded-circle d-flex align-items-center justify-content-center fw-bold"
                      style={{ width: "34px", height: "34px", fontSize: "12px" }}
                      aria-hidden="true"
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span
                    className="d-none d-xl-inline small fw-semibold text-truncate"
                    style={{ maxWidth: 110 }}
                  >
                    {user.name?.split(" ")[0]}
                  </span>
                </Link>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="nav-icon-btn border-0"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <FiLogOut size={16} aria-hidden="true" />
                </Button>
              </>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-primary"
                  size="sm"
                  className="rounded-pill px-3 text-nowrap"
                >
                  Log In
                </Button>
                <Button
                  as={Link}
                  to="/signup"
                  variant="primary"
                  size="sm"
                  className="btn-primary-custom rounded-pill px-3 text-nowrap"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </Container>
      </Navbar>

      <div
        className={`mobile-drawer-overlay ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />
      <aside
        id="mobile-nav-drawer"
        className={`mobile-drawer ${drawerOpen ? "open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!drawerOpen}
        role="dialog"
        aria-modal={drawerOpen}
      >
        <div className="mobile-drawer-header">
          <div className="d-flex align-items-center gap-2 fw-bold text-primary fs-5">
            <FiShare2 aria-hidden="true" /> PostHub
          </div>
          <button
            type="button"
            className="btn btn-sm text-muted p-1 border-0 d-inline-flex align-items-center justify-content-center"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
          >
            <FiX size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="mobile-drawer-body">
          {user && (
            <Link
              to={`/profile/${user.username || ""}`}
              onClick={handleNavClick}
              className="d-flex align-items-center gap-2 p-2 rounded-3 text-decoration-none text-body bg-body-secondary mb-2"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="rounded-circle object-fit-cover"
                  style={{ width: 38, height: 38 }}
                  onError={(e) => {
                    e.currentTarget.dataset.broken = "true";
                  }}
                />
              ) : (
                <div
                  className="post-author-avatar rounded-circle flex-shrink-0"
                  style={{ width: 38, height: 38, fontSize: "0.8rem" }}
                  aria-hidden="true"
                >
                  {getInitials(user.name)}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="fw-semibold text-truncate small">{user.name}</div>
                <div className="text-muted text-truncate" style={{ fontSize: "0.75rem" }}>
                  @{user.username}
                </div>
              </div>
            </Link>
          )}

          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
          >
            <FiFileText size={18} aria-hidden="true" /> <span>Home Feed</span>
          </NavLink>

          <NavLink
            to="/explore"
            onClick={handleNavClick}
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
          >
            <FiCompass size={18} aria-hidden="true" /> <span>Explore</span>
          </NavLink>

          <NavLink
            to="/notifications"
            onClick={handleNavClick}
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
          >
            <FiBell size={18} aria-hidden="true" /> <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge bg="danger" pill className="ms-auto">
                {unreadCount}
              </Badge>
            )}
          </NavLink>

          <NavLink
            to="/saved"
            onClick={handleNavClick}
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
          >
            <FiBookmark size={18} aria-hidden="true" /> <span>Saved Posts</span>
          </NavLink>

          <NavLink
            to="/creator-analytics"
            onClick={handleNavClick}
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
          >
            <FiBarChart2 size={18} aria-hidden="true" /> <span>Creator Analytics</span>
          </NavLink>

          {user && (
            <NavLink
              to={`/profile/${user.username || ""}`}
              onClick={handleNavClick}
              className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
            >
              <FiUser size={18} aria-hidden="true" /> <span>My Profile</span>
            </NavLink>
          )}

          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={({ isActive }) => `mobile-drawer-link ${isActive ? "active" : ""}`}
          >
            <FiSettings size={18} aria-hidden="true" /> <span>Settings</span>
          </NavLink>

          {isAdminOrMod && (
            <NavLink
              to="/admin"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `mobile-drawer-link text-warning ${isActive ? "active" : ""}`
              }
            >
              <FiShield size={18} aria-hidden="true" /> <span>Admin</span>
            </NavLink>
          )}

          <div className="pt-3 mt-auto border-top d-flex flex-column gap-2">
            <Button
              as={Link}
              to="/create-post"
              onClick={handleNavClick}
              variant="primary"
              className="btn-primary-custom w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-pill shadow-sm"
            >
              <FiPlusSquare size={16} aria-hidden="true" />
              <span>Create Post</span>
            </Button>

            {user ? (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleLogout}
                className="w-100 d-flex align-items-center justify-content-center gap-2 py-1.5 mt-1"
              >
                <FiLogOut size={15} aria-hidden="true" /> <span>Sign Out</span>
              </Button>
            ) : (
              <div className="d-flex gap-2 mt-1">
                <Button
                  as={Link}
                  to="/login"
                  onClick={handleNavClick}
                  variant="outline-primary"
                  size="sm"
                  className="w-50 rounded-pill"
                >
                  Log In
                </Button>
                <Button
                  as={Link}
                  to="/signup"
                  onClick={handleNavClick}
                  variant="primary"
                  size="sm"
                  className="btn-primary-custom w-50 rounded-pill"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
