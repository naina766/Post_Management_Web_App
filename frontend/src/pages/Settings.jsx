import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, Modal, Badge } from "react-bootstrap";
import {
  FiUser,
  FiShield,
  FiLock,
  FiBell,
  FiMoon,
  FiSun,
  FiMonitor,
  FiLogOut,
  FiTrash2,
  FiCheck,
  FiAlertTriangle,
} from "react-icons/fi";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { updateSettings, changePassword, deleteAccount } from "../services/users";
import { logoutAll } from "../services/auth";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";

export default function Settings() {
  const { user, refreshUser, logout } = useUser();
  const { themePreference, setThemeMode } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);

  // Privacy State
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    whoCanComment: "everyone",
    whoCanMention: "everyone",
    whoCanFollow: "everyone",
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    replies: true,
    follows: true,
    mentions: true,
    saves: true,
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Populate settings from user object
  useEffect(() => {
    if (user?.privacy) {
      setPrivacy((prev) => ({ ...prev, ...user.privacy }));
    }
    if (user?.notificationSettings) {
      setNotifications((prev) => ({ ...prev, ...user.notificationSettings }));
    }
  }, [user]);

  // Save Privacy / Notification Settings
  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await updateSettings({
        privacy,
        notificationSettings: notifications,
      });
      await refreshUser();
      showToast("Settings updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update settings", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast("Password changed successfully!", "success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password");
      showToast(err.response?.data?.message || "Failed to change password", "danger");
    } finally {
      setChangingPassword(false);
    }
  };

  // Logout All Sessions
  const handleLogoutAll = async () => {
    if (window.confirm("Are you sure you want to log out from all active sessions across all devices?")) {
      try {
        await logoutAll();
        logout();
        showToast("Logged out of all sessions. Please log in again.", "info");
        navigate("/login");
      } catch {
        showToast("Failed to revoke all sessions", "danger");
      }
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast("Please enter your password to confirm deletion", "danger");
      return;
    }
    setDeletingAccount(true);
    try {
      await deleteAccount({ password: deletePassword });
      logout();
      showToast("Your account has been permanently deactivated", "info");
      navigate("/login");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to deactivate account", "danger");
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const navItems = [
    { id: "account", label: "Account", icon: <FiUser size={16} /> },
    { id: "privacy", label: "Privacy", icon: <FiShield size={16} /> },
    { id: "security", label: "Security", icon: <FiLock size={16} /> },
    { id: "notifications", label: "Notifications", icon: <FiBell size={16} /> },
    { id: "appearance", label: "Appearance", icon: <FiMoon size={16} /> },
  ];

  return (
    <div className="settings-page page-enter-animate">
      <Container style={{ maxWidth: "1000px" }}>
        {/* Unified Page Header */}
        <PageHeader
          title="Settings"
          description="Manage your account identity, security, privacy preferences, and app theme."
        />

        {/* Mobile Horizontal Section Tabs (<= 768px) */}
        <div className="d-md-none mb-3 overflow-x-auto pb-1 no-scrollbar">
          <div className="d-flex gap-1.5" role="tablist" aria-label="Settings sections">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeTab === item.id}
                className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5 flex-shrink-0 ${
                  activeTab === item.id
                    ? "btn-primary"
                    : "btn-outline-secondary border-0 bg-card"
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <Row className="g-4">
          {/* Desktop Left Sidenav */}
          <Col lg={3} md={4} className="d-none d-md-block">
            <Card className="border shadow-sm rounded-4 p-2 bg-card">
              <nav className="d-flex flex-column gap-1" role="tablist" aria-label="Settings navigation">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`ph-settings-nav-item d-flex align-items-center gap-2.5 rounded-3 py-2 px-3 fw-medium text-start border-0 bg-transparent ${
                      activeTab === item.id ? "active" : "text-secondary"
                    }`}
                  >
                    <span className="ph-settings-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </Col>

          {/* Right Content Panel */}
          <Col lg={9} md={8}>
            {/* 1. Account Tab */}
            {activeTab === "account" && (
              <Card className="border shadow-sm rounded-4 p-4 bg-card">
                <h5 className="fw-bold mb-1 text-body d-flex align-items-center gap-2">
                  <FiUser className="text-primary" /> Account Details
                </h5>
                <p className="text-muted small mb-4">View your registered PostHub account credentials and verification status.</p>

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control ph-form-control bg-secondary-subtle"
                    value={user?.email || ""}
                    disabled
                    readOnly
                  />
                  <small className="text-muted mt-1 d-block">Primary authentication credential.</small>
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary small fw-semibold">Username</label>
                  <input
                    type="text"
                    className="form-control ph-form-control bg-secondary-subtle"
                    value={`@${user?.username || ""}`}
                    disabled
                    readOnly
                  />
                </div>

                <div className="d-flex flex-wrap gap-4 py-3 border-top">
                  <div>
                    <span className="text-muted small d-block mb-1">Account Role</span>
                    <Badge bg="primary" className="text-uppercase px-2 py-1">{user?.role || "user"}</Badge>
                  </div>
                  <div>
                    <span className="text-muted small d-block mb-1">Verification</span>
                    <Badge bg={user?.isVerified ? "success" : "secondary"} className="px-2 py-1">
                      {user?.isVerified ? "Verified Creator" : "Standard Member"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted small d-block mb-1">Member Since</span>
                    <span className="small fw-semibold text-body">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* 2. Privacy Tab */}
            {activeTab === "privacy" && (
              <Card className="border shadow-sm rounded-4 p-4 bg-card">
                <h5 className="fw-bold mb-1 text-body d-flex align-items-center gap-2">
                  <FiShield className="text-primary" /> Privacy Preferences
                </h5>
                <p className="text-muted small mb-4">Control who can discover, follow, and interact with your content.</p>

                <Form onSubmit={handleSaveSettings}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium text-body small">Profile Visibility</Form.Label>
                    <Form.Select
                      className="ph-form-control"
                      value={privacy.profileVisibility}
                      onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                    >
                      <option value="public">Public (Everyone can see your profile & posts)</option>
                      <option value="private">Private (Only followers can see your profile & posts)</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium text-body small">Who Can Comment On Your Posts</Form.Label>
                    <Form.Select
                      className="ph-form-control"
                      value={privacy.whoCanComment}
                      onChange={(e) => setPrivacy({ ...privacy, whoCanComment: e.target.value })}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="followers">Followers only</option>
                      <option value="none">No one</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium text-body small">Who Can Mention You</Form.Label>
                    <Form.Select
                      className="ph-form-control"
                      value={privacy.whoCanMention}
                      onChange={(e) => setPrivacy({ ...privacy, whoCanMention: e.target.value })}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="followers">Followers only</option>
                      <option value="none">No one</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-body small">Who Can Follow You</Form.Label>
                    <Form.Select
                      className="ph-form-control"
                      value={privacy.whoCanFollow}
                      onChange={(e) => setPrivacy({ ...privacy, whoCanFollow: e.target.value })}
                    >
                      <option value="everyone">Anyone directly</option>
                      <option value="approval_required">Require follow approval</option>
                    </Form.Select>
                  </Form.Group>

                  <Button type="submit" variant="primary" className="rounded-pill px-4" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" /> Saving...
                      </>
                    ) : (
                      <>
                        <FiCheck className="me-1.5" /> Save Privacy Settings
                      </>
                    )}
                  </Button>
                </Form>
              </Card>
            )}

            {/* 3. Security Tab */}
            {activeTab === "security" && (
              <div className="d-flex flex-column gap-4">
                {/* Change Password Card */}
                <Card className="border shadow-sm rounded-4 p-4 bg-card">
                  <h5 className="fw-bold mb-1 text-body d-flex align-items-center gap-2">
                    <FiLock className="text-primary" /> Change Password
                  </h5>
                  <p className="text-muted small mb-4">Ensure your account uses a strong password of at least 6 characters.</p>

                  <Form onSubmit={handleChangePassword}>
                    {passwordError && (
                      <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                        <FiAlertTriangle className="flex-shrink-0" /> {passwordError}
                      </div>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-body small">Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                        className="ph-form-control"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-body small">New Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="At least 6 characters"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        className="ph-form-control"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium text-body small">Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordForm.confirmNewPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                        required
                        className="ph-form-control"
                      />
                    </Form.Group>

                    <Button type="submit" variant="primary" className="rounded-pill px-4" disabled={changingPassword}>
                      {changingPassword ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" /> Updating...
                        </>
                      ) : (
                        <>
                          <FiCheck className="me-1.5" /> Update Password
                        </>
                      )}
                    </Button>
                  </Form>
                </Card>

                {/* Sessions Management Card */}
                <Card className="border shadow-sm rounded-4 p-4 bg-card">
                  <h5 className="fw-bold mb-1 text-body d-flex align-items-center gap-2">
                    <FiLogOut className="text-warning" /> Active Sessions
                  </h5>
                  <p className="text-muted small mb-3">
                    Revoke all active refresh tokens across every signed-in mobile app or desktop browser.
                  </p>

                  <div>
                    <Button variant="outline-warning" onClick={handleLogoutAll} className="rounded-pill px-4 d-inline-flex align-items-center gap-2">
                      <FiLogOut /> Logout From All Sessions
                    </Button>
                  </div>
                </Card>

                {/* Danger Zone Card */}
                <Card className="ph-danger-zone-card border shadow-sm rounded-4 p-4 bg-card">
                  <h5 className="fw-bold mb-1 text-danger d-flex align-items-center gap-2">
                    <FiAlertTriangle /> Danger Zone
                  </h5>
                  <p className="text-muted small mb-3">
                    Permanently deactivate your PostHub account. Your profile and posts will be hidden from public discovery.
                  </p>

                  <div>
                    <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)} className="rounded-pill px-4 d-inline-flex align-items-center gap-2">
                      <FiTrash2 /> Deactivate Account
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* 4. Notifications Tab */}
            {activeTab === "notifications" && (
              <Card className="border shadow-sm rounded-4 p-4 bg-card">
                <h5 className="fw-bold mb-1 text-body d-flex align-items-center gap-2">
                  <FiBell className="text-primary" /> Notification Preferences
                </h5>
                <p className="text-muted small mb-4">Choose which in-app activity notifications you want to receive.</p>

                <Form onSubmit={handleSaveSettings}>
                  <div className="d-flex flex-column gap-3 mb-4">
                    <Form.Check
                      type="switch"
                      id="notif-likes"
                      label="Likes on your posts"
                      checked={notifications.likes}
                      onChange={(e) => setNotifications({ ...notifications, likes: e.target.checked })}
                      className="ph-custom-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="notif-comments"
                      label="Comments on your posts"
                      checked={notifications.comments}
                      onChange={(e) => setNotifications({ ...notifications, comments: e.target.checked })}
                      className="ph-custom-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="notif-replies"
                      label="Replies to your comments"
                      checked={notifications.replies}
                      onChange={(e) => setNotifications({ ...notifications, replies: e.target.checked })}
                      className="ph-custom-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="notif-follows"
                      label="New followers"
                      checked={notifications.follows}
                      onChange={(e) => setNotifications({ ...notifications, follows: e.target.checked })}
                      className="ph-custom-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="notif-mentions"
                      label="Mentions (@username) in posts and comments"
                      checked={notifications.mentions}
                      onChange={(e) => setNotifications({ ...notifications, mentions: e.target.checked })}
                      className="ph-custom-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="notif-saves"
                      label="When someone bookmarks your post"
                      checked={notifications.saves}
                      onChange={(e) => setNotifications({ ...notifications, saves: e.target.checked })}
                      className="ph-custom-switch"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="rounded-pill px-4" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" /> Saving...
                      </>
                    ) : (
                      <>
                        <FiCheck className="me-1.5" /> Save Notification Preferences
                      </>
                    )}
                  </Button>
                </Form>
              </Card>
            )}

            {/* 5. Appearance Tab */}
            {activeTab === "appearance" && (
              <Card className="border shadow-sm rounded-4 p-4 bg-card">
                <h5 className="fw-bold mb-1 text-body d-flex align-items-center gap-2">
                  <FiMoon className="text-primary" /> Appearance & Theme
                </h5>
                <p className="text-muted small mb-4">Choose how PostHub looks across your devices.</p>

                <Row className="g-3">
                  <Col sm={4}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setThemeMode("light")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setThemeMode("light"); }}
                      className={`ph-theme-card p-3.5 text-center border-2 rounded-3 h-100 ${
                        themePreference === "light" ? "active" : ""
                      }`}
                    >
                      <FiSun className="fs-3 text-warning mx-auto mb-2" />
                      <h6 className="fw-bold mb-1 text-body">Light</h6>
                      <small className="text-muted">Clean bright interface</small>
                    </div>
                  </Col>

                  <Col sm={4}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setThemeMode("dark")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setThemeMode("dark"); }}
                      className={`ph-theme-card p-3.5 text-center border-2 rounded-3 h-100 ${
                        themePreference === "dark" ? "active" : ""
                      }`}
                    >
                      <FiMoon className="fs-3 text-primary mx-auto mb-2" />
                      <h6 className="fw-bold mb-1 text-body">Dark</h6>
                      <small className="text-muted">Blue-toned SaaS dark</small>
                    </div>
                  </Col>

                  <Col sm={4}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setThemeMode("system")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setThemeMode("system"); }}
                      className={`ph-theme-card p-3.5 text-center border-2 rounded-3 h-100 ${
                        themePreference === "system" ? "active" : ""
                      }`}
                    >
                      <FiMonitor className="fs-3 text-secondary mx-auto mb-2" />
                      <h6 className="fw-bold mb-1 text-body">System</h6>
                      <small className="text-muted">Matches your OS theme</small>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}
          </Col>
        </Row>

        {/* Delete Account Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton className="border-bottom">
            <Modal.Title className="text-danger fw-bold d-flex align-items-center gap-2 h6 mb-0">
              <FiAlertTriangle /> Deactivate Account
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-4">
            <p className="text-muted small mb-3">
              This action will mark your account as deactivated and hide your profile and published posts from public discovery.
              Enter your password below to confirm:
            </p>
            <Form.Group>
              <Form.Label className="fw-medium text-body small">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="ph-form-control"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top">
            <Button variant="outline-secondary" className="rounded-pill px-3" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="rounded-pill px-4" onClick={handleDeleteAccount} disabled={deletingAccount}>
              {deletingAccount ? <Spinner size="sm" animation="border" className="me-2" /> : null}
              Permanently Deactivate
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}
