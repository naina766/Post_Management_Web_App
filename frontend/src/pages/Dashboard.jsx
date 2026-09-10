import React, { useEffect, useState, useCallback, useRef } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { 
  FiSearch, 
  FiFilter, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiUsers, 
  FiClock, 
  FiCompass,
  FiAlertCircle
} from "react-icons/fi";
import { getPosts, deletePost as deletePostApi } from "../services/posts";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import PostCard from "../components/PostCard";
import Composer from "../components/Composer";
import PostSkeleton from "../components/PostSkeleton";
import EmptyState from "../components/EmptyState";
import { RightWidgets } from "../components/Sidebar";

export default function Dashboard() {
  const { user } = useUser();
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [feedError, setFeedError] = useState(false);

  // Tabs: "forYou", "following", "trending", "latest"
  const [feedTab, setFeedTab] = useState("forYou");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  });

  const searchTimeoutRef = useRef(null);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
  };

  const fetchFeed = useCallback(
    async (
      pageNum = 1,
      searchQuery = search,
      sortOrder = sort,
      tab = feedTab,
      isLoadMore = false
    ) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setFeedError(false);
      }

      try {
        const res = await getPosts({
          page: pageNum,
          limit: 10,
          search: searchQuery.trim(),
          sort: sortOrder,
          feedType: tab,
        });

        const data = res.data?.data;
        if (data) {
          if (isLoadMore) {
            setPosts((prev) => [...prev, ...data.posts]);
          } else {
            setPosts(data.posts || []);
          }
          setPagination(data.pagination);
          setPage(pageNum);
        }
      } catch (err) {
        if (!isLoadMore) {
          setFeedError(true);
        }
        showToast(
          err.response?.data?.message || "Failed to load posts. Please check your connection.",
          "danger"
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setSearching(false);
      }
    },
    [search, sort, feedTab, showToast]
  );

  useEffect(() => {
    fetchFeed(1, search, sort, feedTab, false);
  }, [sort, feedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setSearching(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchFeed(1, val, sort, feedTab, false);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearching(false);
    fetchFeed(1, "", sort, feedTab, false);
  };

  const handleLoadMore = () => {
    if (pagination.hasNextPage && !loadingMore) {
      fetchFeed(page + 1, search, sort, feedTab, true);
    }
  };

  const handleDeletePost = async (id) => {
    await deletePostApi(id);
    setPosts((prev) => prev.filter((p) => p._id !== id));
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  };

  return (
    <div className="dashboard-page page-enter-animate">
      <div className="dashboard-content-layout">

          {/* Center Column: Main Community Feed */}
          <section className="feed-stream-column">
            {/* Compact Header */}
            <div className="feed-header mb-3">
              <h1 className="feed-title h4 fw-bold mb-1 text-body">Home Feed</h1>
              <p className="feed-subtitle text-muted small mb-0">
                Discover conversations, ideas, and creators worth following.
              </p>
            </div>

            {/* Premium Inline Composer */}
            <div className="mb-3">
              <Composer user={user} onPostCreated={handlePostCreated} />
            </div>

            {/* Social Feed Tabs — Unified Single Row Control with Integrated Sort */}
            <div className="feed-tabs-container mb-3">
              <div className="feed-tabs-scroll" role="tablist" aria-label="Feed filters">
                <button
                  type="button"
                  role="tab"
                  aria-selected={feedTab === "forYou"}
                  className={`feed-tab-btn ${feedTab === "forYou" ? "active" : ""}`}
                  onClick={() => setFeedTab("forYou")}
                >
                  <FiCompass size={15} /> <span>For You</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={feedTab === "following"}
                  className={`feed-tab-btn ${feedTab === "following" ? "active" : ""}`}
                  onClick={() => setFeedTab("following")}
                >
                  <FiUsers size={15} /> <span>Following</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={feedTab === "trending"}
                  className={`feed-tab-btn ${feedTab === "trending" ? "active" : ""}`}
                  onClick={() => setFeedTab("trending")}
                >
                  <FiTrendingUp size={15} /> <span>Trending</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={feedTab === "latest"}
                  className={`feed-tab-btn ${feedTab === "latest" ? "active" : ""}`}
                  onClick={() => setFeedTab("latest")}
                >
                  <FiClock size={15} /> <span>Latest</span>
                </button>
              </div>

              {/* Integrated Sort Dropdown */}
              <div className="feed-filter-area d-flex align-items-center gap-1.5 ms-auto">
                <label htmlFor="feedSortSelect" className="text-muted small mb-0 d-none d-sm-inline" aria-label="Sort options">
                  <FiFilter size={13} />
                </label>
                <Form.Select
                  id="feedSortSelect"
                  size="sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="feed-sort-select"
                  aria-label="Sort posts"
                >
                  <option value="latest">Latest</option>
                  <option value="trending">Trending</option>
                  <option value="likes">Most Liked</option>
                  <option value="comments">Most Commented</option>
                </Form.Select>
              </div>
            </div>

            {/* Compact Search Bar */}
            <div className="mb-3">
              <div className="search-bar-wrapper d-flex align-items-center px-3 py-1.5">
                {searching ? (
                  <Spinner size="sm" animation="border" variant="primary" style={{ width: 14, height: 14 }} className="me-2" />
                ) : (
                  <FiSearch className="text-muted me-2" size={14} />
                )}
                <input
                  type="text"
                  className="search-bar-input flex-grow-1 bg-transparent border-0 text-body"
                  placeholder="Search posts by keyword or author..."
                  value={search}
                  onChange={handleSearchChange}
                  aria-label="Search posts"
                />
                {search && (
                  <button
                    type="button"
                    className="btn btn-sm text-muted p-0 border-0 ms-1"
                    onClick={handleClearSearch}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Feed Content Stream */}
            {feedError ? (
              <div className="text-center py-5 px-3 rounded-4 bg-card border shadow-sm">
                <div className="text-danger mb-2">
                  <FiAlertCircle size={36} />
                </div>
                <h5 className="fw-bold mb-1 text-body">Something went wrong</h5>
                <p className="text-muted small mb-3">We couldn't load your feed. Please check your connection.</p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="rounded-pill px-4"
                  onClick={() => fetchFeed(1, search, sort, feedTab, false)}
                >
                  Try Again
                </Button>
              </div>
            ) : loading ? (
              <div className="feed-skeletons d-flex flex-column gap-3">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                icon={feedTab === "following" ? <FiUsers size={36} /> : search ? <FiSearch size={36} /> : <FiCompass size={36} />}
                title={
                  feedTab === "following"
                    ? "No posts from creators you follow"
                    : search
                    ? `No posts found for "${search}"`
                    : "No posts yet"
                }
                message={
                  feedTab === "following"
                    ? "Follow creators from the Explore page or recommendations to see their latest updates here!"
                    : search
                    ? "Try adjusting your search terms or clearing the filter."
                    : "Be the first to share something with the PostHub community!"
                }
                actionText={feedTab === "following" ? "Discover Creators" : "Create Post"}
                actionLink={feedTab === "following" ? "/explore" : "/create-post"}
              />
            ) : (
              <div className="feed-stream d-flex flex-column gap-3">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUser={user}
                    onDeletePost={handleDeletePost}
                  />
                ))}

                {/* Pagination / Infinite Scroll Trigger */}
                {pagination.hasNextPage ? (
                  <div className="text-center py-3">
                    <Button
                      variant="outline-primary"
                      className="px-4 py-1.5 rounded-pill fw-medium small"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" /> Loading more...
                        </>
                      ) : (
                        <>
                          <FiRefreshCw className="me-2" /> Load More Posts ({posts.length} of {pagination.total})
                        </>
                      )}
                    </Button>
                  </div>
                ) : posts.length > 5 ? (
                  <div className="text-center py-3 text-muted small d-flex align-items-center justify-content-center gap-1">
                    <FiCheckCircle size={14} className="text-success" /> You've caught up with all posts.
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {/* Right Column: Trending & Suggestions Widgets (Desktop >= xl) */}
          <aside className="d-none d-xl-block dashboard-widgets-column">
            <RightWidgets />
          </aside>
        </div>
      </div>
  );
}
