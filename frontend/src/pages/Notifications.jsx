import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Container, Button, Spinner } from "react-bootstrap";
import { 
  FiBell, 
  FiHeart, 
  FiMessageSquare, 
  FiUserPlus, 
  FiCornerDownRight, 
  FiAtSign, 
  FiBookmark, 
  FiCheck,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import { getNotifications, markAsRead, markAllAsRead } from "../services/notifications";
import { formatTimeAgo } from "../utils/timeAgo";
import { useToast } from "../context/ToastContext";
import NotificationSkeleton from "../components/NotificationSkeleton";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";

export default function Notifications() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [filterTab, setFilterTab] = useState("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getNotifications({ page: 1, limit: 50 });
      setNotifications(res.data?.data?.notifications || []);
    } catch {
      setError(true);
      showToast("Failed to load notifications.", "danger");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Silently ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast("All notifications marked as read.", "success", 2000);
    } catch {
      showToast("Failed to update notifications.", "danger");
    } finally {
      setMarkingAll(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case "LIKE":
        return <FiHeart className="text-danger" size={15} />;
      case "COMMENT":
        return <FiMessageSquare className="text-primary" size={15} />;
      case "REPLY":
        return <FiCornerDownRight className="text-info" size={15} />;
      case "FOLLOW":
        return <FiUserPlus className="text-success" size={15} />;
      case "MENTION":
        return <FiAtSign className="text-warning" size={15} />;
      case "SAVE":
        return <FiBookmark className="text-primary" size={15} />;
      default:
        return <FiBell className="text-secondary" size={15} />;
    }
  };

  // Local filter
  const filteredNotifications = useMemo(() => {
    if (filterTab === "all") return notifications;
    if (filterTab === "likes") return notifications.filter((n) => n.type === "LIKE");
    if (filterTab === "comments") return notifications.filter((n) => ["COMMENT", "REPLY"].includes(n.type));
    if (filterTab === "follows") return notifications.filter((n) => n.type === "FOLLOW");
    if (filterTab === "mentions") return notifications.filter((n) => n.type === "MENTION");
    return notifications;
  }, [notifications, filterTab]);

  // Group notifications into Today, Yesterday, and Earlier
  const groupedNotifications = useMemo(() => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    filteredNotifications.forEach((item) => {
      const itemDate = new Date(item.createdAt);
      if (itemDate >= startOfToday) {
        today.push(item);
      } else if (itemDate >= startOfYesterday) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Earlier", items: earlier },
    ].filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  const hasUnread = notifications.some((n) => !n.read);

  const renderNotificationItem = (n) => {
    const actor = n.actor || { name: "Someone", username: "user" };
    const post = n.post;

    return (
      <div
        key={n._id}
        className={`list-group-item list-group-item-action p-3 d-flex align-items-center justify-content-between gap-3 border-0 border-bottom notification-item-animate ${
          !n.read ? "notification-item-unread" : ""
        }`}
        onClick={() => !n.read && handleMarkAsRead(n._id)}
        style={{ cursor: "pointer", transition: "background-color 150ms ease" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="notification-icon-wrapper rounded-circle p-2 bg-body d-flex align-items-center justify-content-center shadow-sm flex-shrink-0">
            {getIconForType(n.type)}
          </div>

          <Link to={`/profile/${actor.username}`} className="text-decoration-none flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {actor.avatar ? (
              <img
                src={actor.avatar}
                alt={actor.name}
                className="rounded-circle object-fit-cover"
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold small"
                style={{ width: 40, height: 40 }}
              >
                {(actor.name || "U")[0].toUpperCase()}
              </div>
            )}
          </Link>

          <div>
            <div className="small">
              <Link
                to={`/profile/${actor.username}`}
                className="fw-bold text-body text-decoration-none hover-underline"
                onClick={(e) => e.stopPropagation()}
              >
                {actor.name}
              </Link>{" "}
              <span className="text-muted">{n.message || "interacted with you"}</span>
              {post && (
                <Link
                  to={`/dashboard#${post._id}`}
                  className="text-primary text-decoration-none ms-1 fw-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  "{post.title ? post.title.slice(0, 30) : post.content?.slice(0, 30)}..."
                </Link>
              )}
            </div>
            <span className="text-muted small" style={{ fontSize: "11px" }}>
              {formatTimeAgo(n.createdAt)}
            </span>
          </div>
        </div>

        {!n.read && (
          <span
            className="d-inline-block rounded-circle bg-primary flex-shrink-0"
            style={{ width: 8, height: 8 }}
            title="Unread"
          />
        )}
      </div>
    );
  };

  return (
    <div className="notifications-page page-enter-animate">
      <Container className="ph-page-container" style={{ maxWidth: "900px" }}>
        {/* Page Header */}
        <PageHeader
          title="Notifications"
          description="Stay updated with activity around your posts and profile."
        >
          {hasUnread && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="d-flex align-items-center gap-1.5 rounded-pill px-3 py-1 small fw-medium"
            >
              {markingAll ? <Spinner size="sm" animation="border" /> : <><FiCheck size={14} /> <span>Mark all as read</span></>}
            </Button>
          )}
        </PageHeader>

        {/* Notification Filter Chips */}
        <div className="feed-tabs-container mb-3">
          <div className="feed-tabs-scroll" role="tablist" aria-label="Notification filters">
            <button
              type="button"
              role="tab"
              aria-selected={filterTab === "all"}
              className={`feed-tab-btn ${filterTab === "all" ? "active" : ""}`}
              onClick={() => setFilterTab("all")}
            >
              <span>All</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterTab === "likes"}
              className={`feed-tab-btn ${filterTab === "likes" ? "active" : ""}`}
              onClick={() => setFilterTab("likes")}
            >
              <FiHeart size={14} /> <span>Likes</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterTab === "comments"}
              className={`feed-tab-btn ${filterTab === "comments" ? "active" : ""}`}
              onClick={() => setFilterTab("comments")}
            >
              <FiMessageSquare size={14} /> <span>Comments</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterTab === "follows"}
              className={`feed-tab-btn ${filterTab === "follows" ? "active" : ""}`}
              onClick={() => setFilterTab("follows")}
            >
              <FiUserPlus size={14} /> <span>Follows</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterTab === "mentions"}
              className={`feed-tab-btn ${filterTab === "mentions" ? "active" : ""}`}
              onClick={() => setFilterTab("mentions")}
            >
              <FiAtSign size={14} /> <span>Mentions</span>
            </button>
          </div>
        </div>

        {error ? (
          <div className="text-center py-5 px-3 rounded-4 bg-card border shadow-sm">
            <div className="text-danger mb-2">
              <FiAlertCircle size={36} />
            </div>
            <h5 className="fw-bold mb-1 text-body">Couldn't load notifications</h5>
            <p className="text-muted small mb-3">Something went wrong. Please check your connection and try again.</p>
            <Button
              variant="outline-primary"
              size="sm"
              className="rounded-pill px-4"
              onClick={fetchNotifications}
            >
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <div className="d-flex flex-column gap-3">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={<FiBell size={32} className="text-primary" />}
            title="You're all caught up"
            message="New activity around your posts and network will appear here."
            actionText="Browse Feed"
            actionLink="/dashboard"
          />
        ) : (
          <div className="d-flex flex-column gap-3">
            {groupedNotifications.map((group) => (
              <div key={group.label} className="notification-group">
                <div className="d-flex align-items-center justify-content-between px-2 mb-2">
                  <h6 className="fw-bold text-muted text-uppercase mb-0" style={{ fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {group.label}
                  </h6>
                  <span className="badge bg-secondary-subtle text-secondary small rounded-pill">
                    {group.items.length}
                  </span>
                </div>
                <div className="list-group rounded-4 border shadow-sm overflow-hidden bg-card">
                  {group.items.map(renderNotificationItem)}
                </div>
              </div>
            ))}

            <div className="text-center py-3 text-muted small d-flex align-items-center justify-content-center gap-1">
              <FiCheckCircle size={14} className="text-success" /> You're up to date with your activity.
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
