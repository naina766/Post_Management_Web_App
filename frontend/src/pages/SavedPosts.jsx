import React, { useState, useEffect, useCallback } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FiBookmark, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { getSavedPosts } from "../services/posts";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";

export default function SavedPosts() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, hasNextPage: false, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSaved = useCallback(
    async (pageNum = 1, isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(false);
      }

      try {
        const res = await getSavedPosts({ page: pageNum, limit: 10 });
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
      } catch {
        if (!isLoadMore) {
          setError(true);
        }
        showToast("Failed to load saved posts.", "danger");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchSaved(1, false);
  }, [fetchSaved]);

  const handleRemovePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  };

  return (
    <div className="saved-posts-page page-enter-animate">
      <div className="ph-focused-page">
        {/* Page Header */}
        <PageHeader
          title="Saved Posts"
          description="Your bookmarked conversations and posts."
        />

        {error ? (
          <div className="text-center py-4 px-3 rounded-4 bg-card border shadow-sm">
            <div className="text-danger mb-2" aria-hidden="true">
              <FiAlertCircle size={32} />
            </div>
            <h5 className="fw-bold mb-1 text-body">Couldn't load saved posts</h5>
            <p className="text-muted small mb-3">Something went wrong. Please check your connection and try again.</p>
            <Button
              variant="outline-primary"
              size="sm"
              className="rounded-pill px-4"
              onClick={() => fetchSaved(1, false)}
            >
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <div className="d-flex flex-column gap-3">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<FiBookmark size={32} className="text-primary" />}
            title="Nothing saved yet"
            message="Save posts you want to revisit later by clicking the bookmark icon on any post."
            actionText="Explore Posts"
            actionLink="/explore"
          />
        ) : (
          <div className="d-flex flex-column gap-3 saved-posts-stream">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onDeletePost={handleRemovePost}
                onSaveToggle={(postId, isSaved) => {
                  if (!isSaved) handleRemovePost(postId);
                }}
              />
            ))}

            {pagination.hasNextPage && (
              <div className="text-center mt-1 py-2">
                <Button
                  variant="outline-primary"
                  onClick={() => fetchSaved(page + 1, true)}
                  disabled={loadingMore}
                  className="px-4 py-1.5 rounded-pill small fw-medium"
                >
                  {loadingMore ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" /> Loading...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="me-2" aria-hidden="true" /> Load More Saved Posts ({posts.length} of {pagination.total})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
