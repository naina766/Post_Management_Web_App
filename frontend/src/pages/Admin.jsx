import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Table, Button, Badge, Form, InputGroup, Nav } from "react-bootstrap";
import { 
  FiShield, 
  FiUsers, 
  FiFileText, 
  FiAlertTriangle, 
  FiSearch, 
  FiCheckCircle, 
  FiXCircle, 
  FiLock, 
  FiUnlock,
  FiActivity,
  FiRefreshCw
} from "react-icons/fi";
import { getAdminStats, getAdminUsers, toggleUserSuspension, updateUserRole, getAuditLogs } from "../services/admin";
import { getReports, updateReportStatus } from "../services/reports";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";

export default function Admin() {
  const { user } = useUser();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("overview"); // overview, reports, users, audit
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, usersRes, auditRes] = await Promise.all([
        getAdminStats(),
        getReports({ status: "ALL", limit: 30 }),
        getAdminUsers({ limit: 30 }),
        getAuditLogs({ limit: 40 }),
      ]);
      setStats(statsRes.data?.data);
      setReports(reportsRes.data?.data?.reports || []);
      setUsersList(usersRes.data?.data?.users || []);
      setAuditLogs(auditRes.data?.data?.logs || []);
    } catch {
      showToast("Failed to load admin data.", "danger");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle User Search
  const handleUserSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await getAdminUsers({ search: userSearch });
      setUsersList(res.data?.data?.users || []);
    } catch {
      showToast("User search failed.", "danger");
    }
  };

  // Toggle Account Suspension
  const handleToggleSuspend = async (userId) => {
    setActionPending(true);
    try {
      const res = await toggleUserSuspension(userId);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isSuspended: res.data?.data?.isSuspended } : u))
      );
      showToast(res.data?.message || "User status updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update suspension.", "danger");
    } finally {
      setActionPending(false);
    }
  };

  // Change Role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      showToast("Role updated", "success", 1500);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change role.", "danger");
    }
  };

  // Update Report Status
  const handleReportStatus = async (reportId, status) => {
    try {
      await updateReportStatus(reportId, status);
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status } : r))
      );
      showToast(`Report marked as ${status}`, "success", 1500);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update report.", "danger");
    }
  };

  // Enforce existing authorization
  if (!loading && (!user || !["admin", "moderator"].includes(user.role))) {
    return (
      <Container className="py-5 text-center">
        <EmptyState
          title="Access Restricted"
          message="You do not have administrative permissions to view the PostHub moderation console."
          actionText="Back to Feed"
          actionLink="/dashboard"
        />
      </Container>
    );
  }

  const adminTabs = [
    { id: "overview", label: "Overview & KPIs", icon: <FiActivity size={15} /> },
    {
      id: "reports",
      label: "Moderation Reports",
      icon: <FiAlertTriangle size={15} />,
      badge: stats?.pendingReports > 0 ? stats.pendingReports : null,
    },
    { id: "users", label: "User Governance", icon: <FiUsers size={15} /> },
    { id: "audit", label: "Compliance Audit", icon: <FiShield size={15} /> },
  ];

  return (
    <div className="admin-page page-enter-animate">
      <Container style={{ maxWidth: "1200px" }}>
        {/* Unified Page Header */}
        <PageHeader
          title="Admin Dashboard"
          description="Manage content, users, and community activity."
        >
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-pill px-3 d-flex align-items-center gap-1.5"
              onClick={loadData}
              disabled={loading}
              title="Refresh Data"
            >
              <FiRefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
            </Button>
            <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-3 py-1.5 fs-6 text-uppercase fw-semibold rounded-pill">
              {user?.role || "Admin"} Console
            </Badge>
          </div>
        </PageHeader>

        {/* Loading State: Skeleton View */}
        {loading && (
          <div>
            <Row className="g-3 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <Col xs={6} md={3} key={i}>
                  <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                    <div className="ph-skeleton rounded mx-auto mb-2" style={{ width: 80, height: 14 }} />
                    <div className="ph-skeleton rounded mx-auto" style={{ width: 50, height: 28 }} />
                  </Card>
                </Col>
              ))}
            </Row>
            <Card className="p-4 border shadow-sm bg-card rounded-4">
              <div className="ph-skeleton rounded mb-3" style={{ width: 180, height: 20 }} />
              <div className="d-flex flex-column gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="ph-skeleton rounded w-100" style={{ height: 44 }} />
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Main Admin Console */}
        {!loading && (
          <>
            {/* Segmented Admin Navigation Tabs */}
            <div className="feed-tabs-container mb-4">
              <div className="feed-tabs-scroll" role="tablist" aria-label="Admin console navigation">
                {adminTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`feed-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <Badge bg="danger" pill className="ms-1.5 small" style={{ fontSize: "10px" }}>
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Overview Tab */}
            {activeTab === "overview" && stats && (
              <div>
                <Row className="g-3 mb-4">
                  <Col xs={6} md={3}>
                    <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                      <div className="ph-kpi-label text-muted small d-flex align-items-center justify-content-center gap-1.5 mb-1">
                        <FiUsers size={14} className="text-primary" /> Total Users
                      </div>
                      <div className="ph-kpi-value text-body">{stats.totalUsers}</div>
                      <span className="text-muted small mt-1" style={{ fontSize: "12px" }}>+{stats.usersLast24h || 0} in 24h</span>
                    </Card>
                  </Col>

                  <Col xs={6} md={3}>
                    <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                      <div className="ph-kpi-label text-muted small d-flex align-items-center justify-content-center gap-1.5 mb-1">
                        <FiFileText size={14} className="text-primary" /> Total Posts
                      </div>
                      <div className="ph-kpi-value text-body">{stats.totalPosts}</div>
                      <span className="text-muted small mt-1" style={{ fontSize: "12px" }}>+{stats.postsLast24h || 0} in 24h</span>
                    </Card>
                  </Col>

                  <Col xs={6} md={3}>
                    <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                      <div className="ph-kpi-label text-muted small d-flex align-items-center justify-content-center gap-1.5 mb-1">
                        <FiAlertTriangle size={14} className="text-danger" /> Total Reports
                      </div>
                      <div className="ph-kpi-value text-body">{stats.totalReports}</div>
                      <span className="text-muted small mt-1" style={{ fontSize: "12px" }}>all-time flags</span>
                    </Card>
                  </Col>

                  <Col xs={6} md={3}>
                    <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                      <div className="ph-kpi-label text-muted small d-flex align-items-center justify-content-center gap-1.5 mb-1">
                        <FiShield size={14} className="text-warning" /> Pending Actions
                      </div>
                      <div className="ph-kpi-value text-body">{stats.pendingReports}</div>
                      <span className="text-warning small mt-1 fw-medium" style={{ fontSize: "12px" }}>needs review</span>
                    </Card>
                  </Col>
                </Row>

                <Card className="p-4 border shadow-sm rounded-4 bg-card mb-4">
                  <h6 className="fw-bold mb-2 text-body d-flex align-items-center gap-2">
                    <FiShield className="text-primary" /> Community Standards & Moderation Protocol
                  </h6>
                  <p className="text-muted small mb-3">
                    All administrative operations executed in this workspace are written to an immutable audit trail.
                    Review pending items thoroughly against platform safety policies.
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <Button variant="primary" size="sm" className="rounded-pill px-3" onClick={() => setActiveTab("reports")}>
                      Review {stats.pendingReports} Pending Reports
                    </Button>
                    <Button variant="outline-secondary" size="sm" className="rounded-pill px-3" onClick={() => setActiveTab("users")}>
                      Manage Users
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* 2. Reports Tab */}
            {activeTab === "reports" && (
              <Card className="p-4 border shadow-sm rounded-4 bg-card mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 text-body d-flex align-items-center gap-2">
                    <FiAlertTriangle className="text-danger" /> Safety Reports & Flags
                  </h6>
                  <span className="text-muted small">{reports.length} reports logged</span>
                </div>

                {reports.length === 0 ? (
                  <EmptyState
                    title="Nothing requires attention"
                    message="There are no active moderation reports or user flags."
                  />
                ) : (
                  <div className="table-responsive ph-admin-table-wrap">
                    <Table hover align="middle" className="ph-admin-table mb-0 small">
                      <thead>
                        <tr className="text-muted small">
                          <th>Target</th>
                          <th>Reason</th>
                          <th>Reporter</th>
                          <th>Details</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((r) => (
                          <tr key={r._id}>
                            <td>
                              <Badge bg="secondary-subtle" className="text-secondary border small fw-normal">
                                {r.targetType}
                              </Badge>
                            </td>
                            <td className="fw-semibold text-danger">{r.reason}</td>
                            <td className="text-body">{r.reporter?.name || "Member"}</td>
                            <td>
                              <span className="text-truncate d-inline-block text-secondary" style={{ maxWidth: 220 }}>
                                {r.details || "No additional text provided"}
                              </span>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  r.status === "RESOLVED"
                                    ? "success-subtle"
                                    : r.status === "PENDING"
                                    ? "warning-subtle"
                                    : "secondary-subtle"
                                }
                                className={`border small fw-medium ${
                                  r.status === "RESOLVED"
                                    ? "text-success border-success-subtle"
                                    : r.status === "PENDING"
                                    ? "text-warning border-warning-subtle"
                                    : "text-secondary border-secondary-subtle"
                                }`}
                              >
                                {r.status}
                              </Badge>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-1.5">
                                {r.status === "PENDING" && (
                                  <>
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      className="py-1 px-2.5 rounded-pill d-inline-flex align-items-center gap-1"
                                      onClick={() => handleReportStatus(r._id, "RESOLVED")}
                                      title="Resolve report"
                                    >
                                      <FiCheckCircle size={12} /> Resolve
                                    </Button>
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      className="py-1 px-2.5 rounded-pill d-inline-flex align-items-center gap-1"
                                      onClick={() => handleReportStatus(r._id, "DISMISSED")}
                                      title="Dismiss report"
                                    >
                                      <FiXCircle size={12} /> Dismiss
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            )}

            {/* 3. Users Management Tab */}
            {activeTab === "users" && (
              <Card className="p-4 border shadow-sm rounded-4 bg-card mb-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
                  <div>
                    <h6 className="fw-bold mb-0 text-body d-flex align-items-center gap-2">
                      <FiUsers className="text-primary" /> User Governance
                    </h6>
                    <span className="text-muted small">Manage account roles, permissions, and status</span>
                  </div>

                  <Form onSubmit={handleUserSearch} style={{ maxWidth: 280 }} className="w-100">
                    <InputGroup size="sm">
                      <Form.Control
                        type="text"
                        placeholder="Search name, username..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="ph-form-control"
                      />
                      <Button variant="primary" type="submit" className="d-flex align-items-center">
                        <FiSearch size={14} />
                      </Button>
                    </InputGroup>
                  </Form>
                </div>

                {usersList.length === 0 ? (
                  <EmptyState
                    title="No users found"
                    message="No registered user matched your search criteria."
                  />
                ) : (
                  <div className="table-responsive ph-admin-table-wrap">
                    <Table hover align="middle" className="ph-admin-table mb-0 small">
                      <thead>
                        <tr className="text-muted small">
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((u) => (
                          <tr key={u._id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="fw-semibold text-body">{u.name}</div>
                                <span className="text-muted small">@{u.username}</span>
                              </div>
                            </td>
                            <td className="text-secondary">{u.email}</td>
                            <td>
                              {user.role === "admin" ? (
                                <Form.Select
                                  size="sm"
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                  style={{ width: 115 }}
                                  disabled={u._id === user._id}
                                  className="ph-form-control py-0.5"
                                >
                                  <option value="user">User</option>
                                  <option value="moderator">Moderator</option>
                                  <option value="admin">Admin</option>
                                </Form.Select>
                              ) : (
                                <Badge bg="primary-subtle" className="text-primary border border-primary-subtle">
                                  {u.role}
                                </Badge>
                              )}
                            </td>
                            <td>
                              <Badge
                                bg={u.isSuspended ? "danger-subtle" : "success-subtle"}
                                className={`border small fw-medium ${
                                  u.isSuspended
                                    ? "text-danger border-danger-subtle"
                                    : "text-success border-success-subtle"
                                }`}
                              >
                                {u.isSuspended ? "Suspended" : "Active"}
                              </Badge>
                            </td>
                            <td className="text-end">
                              {user.role === "admin" && u._id !== user._id && (
                                <Button
                                  variant={u.isSuspended ? "outline-success" : "outline-danger"}
                                  size="sm"
                                  className="py-1 px-3 rounded-pill d-inline-flex align-items-center gap-1"
                                  onClick={() => handleToggleSuspend(u._id)}
                                  disabled={actionPending}
                                >
                                  {u.isSuspended ? (
                                    <>
                                      <FiUnlock size={12} /> Restore
                                    </>
                                  ) : (
                                    <>
                                      <FiLock size={12} /> Suspend
                                    </>
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            )}

            {/* 4. Compliance Audit Trail Tab */}
            {activeTab === "audit" && (
              <Card className="p-4 border shadow-sm rounded-4 bg-card mb-4">
                <h6 className="fw-bold mb-1 text-body d-flex align-items-center gap-2">
                  <FiShield className="text-primary" /> Compliance Audit Trail
                </h6>
                <p className="text-muted small mb-3">
                  Tamper-evident record of security suspensions, permission changes, and moderation decisions.
                </p>

                {auditLogs.length === 0 ? (
                  <EmptyState
                    title="No audit events recorded"
                    message="Administrative events will appear here once actions are performed."
                  />
                ) : (
                  <div className="table-responsive ph-admin-table-wrap">
                    <Table hover align="middle" className="ph-admin-table mb-0 small">
                      <thead>
                        <tr className="text-muted small">
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th>Actor</th>
                          <th>Target</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log._id}>
                            <td className="text-muted text-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td>
                              <Badge bg="secondary-subtle" className="text-secondary border font-monospace fw-normal">
                                {log.action}
                              </Badge>
                            </td>
                            <td>
                              <strong className="text-body">{log.actor?.name || "System"}</strong>
                              <span className="text-muted ms-1 small">(@{log.actor?.username || "root"})</span>
                            </td>
                            <td>
                              <Badge bg="light" text="dark" className="border">
                                {log.targetType}
                              </Badge>
                            </td>
                            <td className="text-muted font-monospace" style={{ fontSize: "11px", maxWidth: 280 }}>
                              <span className="text-truncate d-inline-block" style={{ maxWidth: 260 }}>
                                {JSON.stringify(log.details || {})}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
