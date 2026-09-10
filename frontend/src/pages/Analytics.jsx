import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, ProgressBar, Badge, Button } from "react-bootstrap";
import { 
  FiBarChart2, 
  FiFileText, 
  FiHeart, 
  FiMessageSquare, 
  FiBookmark, 
  FiUsers, 
  FiActivity, 
  FiTrendingUp, 
  FiPieChart,
  FiAlertCircle
} from "react-icons/fi";
import { getCreatorAnalytics } from "../services/analytics";
import { useToast } from "../context/ToastContext";
import AnalyticsSkeleton from "../components/AnalyticsSkeleton";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";

export default function Analytics() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getCreatorAnalytics(period);
      setData(res.data?.data);
    } catch {
      setError(true);
      showToast("Failed to load analytics.", "danger");
    } finally {
      setLoading(false);
    }
  }, [period, showToast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="analytics-page page-enter-animate">
      <Container style={{ maxWidth: "1100px" }}>
        {/* Unified Page Header with Period Selector */}
        <PageHeader
          title="Creator Analytics"
          description="Understand how your content is performing."
        >
          <div className="btn-group btn-group-sm rounded-pill p-1 bg-card border shadow-sm" role="group" aria-label="Analytics time range">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-medium ${period === "7d" ? "btn-primary" : "btn-link text-secondary text-decoration-none"}`}
              onClick={() => setPeriod("7d")}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-medium ${period === "30d" ? "btn-primary" : "btn-link text-secondary text-decoration-none"}`}
              onClick={() => setPeriod("30d")}
            >
              30 Days
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-medium ${period === "90d" ? "btn-primary" : "btn-link text-secondary text-decoration-none"}`}
              onClick={() => setPeriod("90d")}
            >
              90 Days
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-medium ${period === "all" ? "btn-primary" : "btn-link text-secondary text-decoration-none"}`}
              onClick={() => setPeriod("all")}
            >
              All Time
            </button>
          </div>
        </PageHeader>

        {/* Loading State: Skeletons */}
        {loading && <AnalyticsSkeleton />}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-5 px-3 rounded-4 bg-card border shadow-sm my-3">
            <div className="text-danger mb-2">
              <FiAlertCircle size={36} />
            </div>
            <h5 className="fw-bold mb-1 text-body">Couldn't load analytics</h5>
            <p className="text-muted small mb-3">Something went wrong while retrieving your creator data.</p>
            <Button
              variant="outline-primary"
              size="sm"
              className="rounded-pill px-4"
              onClick={loadAnalytics}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (!data || data.totalPosts === 0) && (
          <EmptyState
            title="Not enough data yet"
            message="Publish more content to start seeing meaningful analytics."
            actionText="Create Post"
            actionLink="/create-post"
          />
        )}

        {/* Main Analytics Content */}
        {!loading && !error && data && data.totalPosts > 0 && (() => {
          const {
            totalPosts,
            totalLikes,
            totalComments,
            totalSaves,
            engagementRate,
            followersCount,
            breakdown,
            topPosts,
            timeline,
          } = data;

          const totalFormatCount = (breakdown?.text || 0) + (breakdown?.image || 0) + (breakdown?.poll || 0) + (breakdown?.link || 0) || 1;
          const textPct = Math.round(((breakdown?.text || 0) / totalFormatCount) * 100);
          const imagePct = Math.round(((breakdown?.image || 0) / totalFormatCount) * 100);
          const pollPct = Math.round(((breakdown?.poll || 0) / totalFormatCount) * 100);
          const linkPct = Math.round(((breakdown?.link || 0) / totalFormatCount) * 100);

          return (
            <>
              {/* Restrained, Clean KPI Cards */}
              <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                  <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                    <div className="ph-kpi-label text-muted small d-flex align-items-center justify-content-center gap-1.5 mb-2">
                      <FiFileText size={14} className="text-primary" /> Total Posts
                    </div>
                    <div className="ph-kpi-value text-body">{totalPosts}</div>
                  </Card>
                </Col>

                <Col xs={6} md={3}>
                  <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                    <div className="ph-kpi-label text-muted small d-flex align-items-center justify-content-center gap-1.5 mb-2">
                      <FiHeart size={14} className="text-danger" /> Likes
                    </div>
                    <div className="ph-kpi-value text-body">{totalLikes}</div>
                  </Card>
                </Col>

                <Col xs={6} md={3}>
                  <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                    <div className="ph-kpi-label text-muted small d-flex align-items-center justify-content-center gap-1.5 mb-2">
                      <FiMessageSquare size={14} className="text-primary" /> Comments
                    </div>
                    <div className="ph-kpi-value text-body">{totalComments}</div>
                  </Card>
                </Col>

                <Col xs={6} md={3}>
                  <Card className="ph-kpi-card p-3 p-md-4 border shadow-sm text-center bg-card">
                    <div className="ph-kpi-label text-muted small d-flex align-items-center justify-content-center gap-1.5 mb-2">
                      <FiBookmark size={14} className="text-accent" /> Saves
                    </div>
                    <div className="ph-kpi-value text-body">{totalSaves}</div>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mb-4">
                {/* Engagement Performance */}
                <Col md={6}>
                  <Card className="p-4 border shadow-sm h-100 bg-card">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-body">
                      <FiActivity className="text-primary" /> Engagement Performance
                    </h6>
                    <div className="d-flex align-items-baseline gap-2 mb-2">
                      <span className="display-6 fw-bold text-body">{engagementRate}</span>
                      <span className="text-muted small">avg interactions / post</span>
                    </div>
                    <p className="text-muted small mb-4">
                      Calculated from your likes, comments, and bookmarks across published posts.
                    </p>

                    <div className="p-3 rounded-3 bg-secondary-subtle d-flex justify-content-around text-center mt-auto">
                      <div>
                        <div className="fw-bold text-body">{followersCount}</div>
                        <div className="text-muted small" style={{ fontSize: "11px" }}>Followers</div>
                      </div>
                      <div className="border-start"></div>
                      <div>
                        <div className="fw-bold text-body">{data.followingCount || 0}</div>
                        <div className="text-muted small" style={{ fontSize: "11px" }}>Following</div>
                      </div>
                      <div className="border-start"></div>
                      <div>
                        <div className="fw-bold text-body">{totalLikes + totalComments}</div>
                        <div className="text-muted small" style={{ fontSize: "11px" }}>Reactions</div>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* Content Format Mix */}
                <Col md={6}>
                  <Card className="p-4 border shadow-sm h-100 bg-card">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-body">
                      <FiPieChart className="text-primary" /> Content Format Mix
                    </h6>
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-secondary">Text Stories</span>
                          <span className="fw-semibold text-body">{breakdown?.text || 0} ({textPct}%)</span>
                        </div>
                        <ProgressBar variant="primary" now={textPct} style={{ height: 6 }} className="rounded-pill" />
                      </div>

                      <div>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-secondary">Images & Media</span>
                          <span className="fw-semibold text-body">{breakdown?.image || 0} ({imagePct}%)</span>
                        </div>
                        <ProgressBar variant="info" now={imagePct} style={{ height: 6 }} className="rounded-pill" />
                      </div>

                      <div>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-secondary">Community Polls</span>
                          <span className="fw-semibold text-body">{breakdown?.poll || 0} ({pollPct}%)</span>
                        </div>
                        <ProgressBar variant="warning" now={pollPct} style={{ height: 6 }} className="rounded-pill" />
                      </div>

                      <div>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-secondary">Link Shares</span>
                          <span className="fw-semibold text-body">{breakdown?.link || 0} ({linkPct}%)</span>
                        </div>
                        <ProgressBar variant="success" now={linkPct} style={{ height: 6 }} className="rounded-pill" />
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Top Performing Posts Table */}
              <Card className="p-4 border shadow-sm mb-4 bg-card">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-body">
                  <FiTrendingUp className="text-primary" /> Top Performing Posts
                </h6>
                {topPosts && topPosts.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr className="text-muted small">
                          <th>Post</th>
                          <th>Format</th>
                          <th className="text-center">Likes</th>
                          <th className="text-center">Comments</th>
                          <th className="text-center">Saves</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPosts.map((post) => (
                          <tr key={post._id}>
                            <td>
                              <div className="fw-semibold small text-truncate text-body" style={{ maxWidth: 300 }}>
                                {post.title || post.content || "Untitled"}
                              </div>
                            </td>
                            <td>
                              <Badge bg="secondary-subtle" className="text-secondary border small fw-normal">
                                {post.postType}
                              </Badge>
                            </td>
                            <td className="text-center small text-danger fw-semibold">{post.likesCount || 0}</td>
                            <td className="text-center small text-primary fw-semibold">{post.commentsCount || 0}</td>
                            <td className="text-center small text-warning fw-semibold">{post.savesCount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted small mb-0">No posts published yet.</p>
                )}
              </Card>

              {/* Monthly Activity History */}
              {timeline && timeline.length > 0 && (
                <Card className="p-4 border shadow-sm bg-card">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-body">
                    <FiUsers className="text-primary" /> Monthly Activity History
                  </h6>
                  <div className="d-flex justify-content-between align-items-end gap-2 pt-3" style={{ height: 160 }}>
                    {timeline.map((item, idx) => {
                      const maxCount = Math.max(...timeline.map((t) => t.count), 1);
                      const height = Math.min(100, Math.max(16, (item.count / maxCount) * 100));
                      return (
                        <div key={idx} className="d-flex flex-column align-items-center flex-grow-1">
                          <span className="small text-muted mb-1" style={{ fontSize: "11px" }}>{item.count}</span>
                          <div
                            className="bg-primary rounded-top w-100"
                            style={{ height: `${height}%`, minHeight: "14px", maxWidth: "42px", transition: "height 200ms ease" }}
                            title={`${item.count} posts in M${item._id.month}/${item._id.year}`}
                          />
                          <span className="small text-muted mt-2" style={{ fontSize: "11px" }}>
                            {item._id.month}/{item._id.year}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </>
          );
        })()}
      </Container>
    </div>
  );
}
