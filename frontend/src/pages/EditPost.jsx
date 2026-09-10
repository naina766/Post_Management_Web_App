import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Form, Button, Spinner } from "react-bootstrap";
import { FiArrowLeft, FiImage, FiX, FiSave } from "react-icons/fi";
import { getPosts, updatePost } from "../services/posts";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await getPosts();
        const postsList = res.data?.data?.posts || res.data?.data || [];
        const found = postsList.find((p) => p._id === id);

        if (!found) {
          showToast("Post not found.", "danger");
          navigate("/dashboard");
          return;
        }

        // Check ownership
        const postAuthorId = typeof found.user === "object" ? found.user?._id : found.user;
        if (user && postAuthorId && user._id !== postAuthorId) {
          showToast("You are not authorized to edit this post.", "danger");
          navigate("/dashboard");
          return;
        }

        setTitle(found.title || "");
        setContent(found.content || "");
        setExistingImage(found.image || "");
      } catch {
        showToast("Failed to load post data.", "danger");
        navigate("/dashboard");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPost();
  }, [id, user, navigate, showToast]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validMimes.includes(file.type)) {
      showToast("Please select a valid image format (JPEG, PNG, or WEBP).", "danger");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB.", "danger");
      return;
    }

    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveNewImage = () => {
    setNewImageFile(null);
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
      setNewImagePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasContent = Boolean(content.trim());
    const hasImage = Boolean(newImageFile || existingImage);

    if (!hasContent && !hasImage) {
      showToast("Post must contain text, an image, or both.", "danger");
      return;
    }

    if (content.length > 2000) {
      showToast("Content cannot exceed 2000 characters.", "danger");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      if (newImageFile) {
        formData.append("image", newImageFile);
      }

      await updatePost(id, formData);
      showToast("Post updated successfully!", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update post.", "danger");
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-5">
        <LoadingSpinner message="Loading post details..." />
      </div>
    );
  }

  return (
    <div className="edit-post-page page-enter-animate">
      <Container className="ph-page-container" style={{ maxWidth: "720px" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <Button
            as={Link}
            to="/dashboard"
            variant="link"
            className="text-decoration-none text-muted p-0 d-flex align-items-center gap-1"
          >
            <FiArrowLeft /> Back to Feed
          </Button>
        </div>

        <div className="auth-card" style={{ maxWidth: "100%", padding: "1.75rem" }}>
          <h3 className="fw-bold mb-1">Edit Post</h3>
          <p className="text-muted small mb-4">Make changes to your post</p>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="editPostTitleInput">
              <Form.Label className="small text-muted mb-1">Title (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                disabled={saving}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="editPostContentInput">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="small text-muted mb-0">Content</Form.Label>
                <span className={`char-counter ${content.length > 1800 ? "near-limit" : ""}`}>
                  {content.length} / 2000
                </span>
              </div>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Write your content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                disabled={saving}
              />
            </Form.Group>

            {/* Current Image or New Image Preview */}
            {newImagePreview ? (
              <div className="mb-3">
                <span className="small text-muted d-block mb-1">New Image Preview:</span>
                <div className="composer-preview-container">
                  <img src={newImagePreview} alt="New Preview" className="composer-preview-img" />
                  <button
                    type="button"
                    className="composer-remove-img"
                    onClick={handleRemoveNewImage}
                    title="Remove new image"
                    disabled={saving}
                    aria-label="Remove new image"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            ) : existingImage ? (
              <div className="mb-3">
                <span className="small text-muted d-block mb-1">Current Image:</span>
                <div className="composer-preview-container">
                  <img src={existingImage} alt="Current attached" className="composer-preview-img" />
                </div>
              </div>
            ) : null}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              disabled={saving}
              aria-label="Upload replacement image"
            />

            <div className="d-flex align-items-center justify-content-between pt-3 border-top">
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="d-flex align-items-center gap-1"
                aria-label={newImageFile || existingImage ? "Change image" : "Add image"}
              >
                <FiImage /> {newImageFile || existingImage ? "Change Image" : "Add Image"}
              </Button>

              <div className="d-flex align-items-center gap-2">
                <Button
                  as={Link}
                  to="/dashboard"
                  variant="outline-secondary"
                  size="sm"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary-custom d-flex align-items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" animation="border" /> Updating...
                    </>
                  ) : (
                    <>
                      <FiSave size={14} /> Update Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </Container>
    </div>
  );
}
