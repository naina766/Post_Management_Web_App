import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Container, Form, Button, Spinner, Nav } from "react-bootstrap";
import { FiImage, FiX, FiSend, FiArrowLeft, FiPieChart, FiLink, FiFileText } from "react-icons/fi";
import { createPost } from "../services/posts";
import { useToast } from "../context/ToastContext";

export default function CreatePost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [postType, setPostType] = useState(location.state?.postType || "TEXT"); // TEXT, IMAGE, POLL, LINK
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Link state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDesc, setLinkDesc] = useState("");

  const [loading, setLoading] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("posthub_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.postType) setPostType(parsed.postType);
        if (parsed.pollQuestion) setPollQuestion(parsed.pollQuestion);
        if (parsed.pollOptions) setPollOptions(parsed.pollOptions);
        if (parsed.linkUrl) setLinkUrl(parsed.linkUrl);
      } catch {
        // Ignore draft parse error
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (title || content || pollQuestion || linkUrl) {
      const draft = {
        title,
        content,
        postType,
        pollQuestion,
        pollOptions,
        linkUrl,
      };
      localStorage.setItem("posthub_draft", JSON.stringify(draft));
    }
  }, [title, content, postType, pollQuestion, pollOptions, linkUrl]);

  const clearDraft = () => {
    localStorage.removeItem("posthub_draft");
    setTitle("");
    setContent("");
    setImageFiles([]);
    setImagePreviews([]);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setLinkUrl("");
    setLinkTitle("");
    setLinkDesc("");
    showToast("Draft cleared", "info", 1500);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (imageFiles.length + files.length > 4) {
      showToast("You can upload up to 4 images per post.", "danger");
      return;
    }

    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!validMimes.includes(file.type)) {
        showToast("Please select valid images (JPEG, PNG, or WEBP).", "danger");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Each image must be less than 5MB.", "danger");
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddPollOption = () => {
    if (pollOptions.length >= 6) {
      showToast("Maximum 6 poll options allowed.", "danger");
      return;
    }
    setPollOptions((prev) => [...prev, ""]);
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length <= 2) {
      showToast("Polls require at least 2 options.", "danger");
      return;
    }
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePollOptionChange = (index, value) => {
    setPollOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (postType === "POLL") {
      if (!pollQuestion.trim()) {
        showToast("Please provide a question for the poll.", "danger");
        return;
      }
      const validOpts = pollOptions.filter((o) => o.trim().length > 0);
      if (validOpts.length < 2) {
        showToast("Please provide at least 2 options for your poll.", "danger");
        return;
      }
    } else if (postType === "LINK") {
      if (!linkUrl.trim()) {
        showToast("Please provide a valid link URL.", "danger");
        return;
      }
    } else {
      if (!content.trim() && imageFiles.length === 0) {
        showToast("Please add some text or an image to your post.", "danger");
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (title.trim()) formData.append("title", title.trim());
      if (content.trim()) formData.append("content", content.trim());
      formData.append("postType", postType);

      if (imageFiles.length === 1) {
        formData.append("image", imageFiles[0]);
      } else if (imageFiles.length > 1) {
        imageFiles.forEach((file) => formData.append("images", file));
      }

      if (postType === "POLL") {
        const pollData = {
          question: pollQuestion.trim(),
          options: pollOptions.filter((o) => o.trim().length > 0).map((t) => ({ text: t.trim() })),
        };
        formData.append("poll", JSON.stringify(pollData));
      }

      if (postType === "LINK" && linkUrl.trim()) {
        const preview = {
          url: linkUrl.trim(),
          title: linkTitle.trim() || linkUrl.trim(),
          description: linkDesc.trim() || "",
        };
        formData.append("linkPreview", JSON.stringify(preview));
      }

      await createPost(formData);
      localStorage.removeItem("posthub_draft");
      showToast("Post published successfully!", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create post. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim() && !title.trim() && imageFiles.length === 0 && !pollQuestion.trim() && !linkUrl.trim()) {
      showToast("Draft is empty. Enter some content before saving.", "warning");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (title.trim()) formData.append("title", title.trim());
      if (content.trim()) formData.append("content", content.trim());
      formData.append("postType", postType);
      formData.append("status", "DRAFT");

      if (imageFiles.length === 1) {
        formData.append("image", imageFiles[0]);
      } else if (imageFiles.length > 1) {
        imageFiles.forEach((file) => formData.append("images", file));
      }

      if (postType === "POLL" && pollQuestion.trim()) {
        const pollData = {
          question: pollQuestion.trim(),
          options: pollOptions.filter((o) => o.trim().length > 0).map((t) => ({ text: t.trim() })),
        };
        formData.append("poll", JSON.stringify(pollData));
      }

      if (postType === "LINK" && linkUrl.trim()) {
        const preview = {
          url: linkUrl.trim(),
          title: linkTitle.trim() || linkUrl.trim(),
          description: linkDesc.trim() || "",
        };
        formData.append("linkPreview", JSON.stringify(preview));
      }

      await createPost(formData);
      localStorage.removeItem("posthub_draft");
      showToast("Draft saved successfully!", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save draft.", "danger");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="create-post-page page-enter-animate">
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
          <div className="d-flex align-items-center gap-2">
            <Button variant="link" size="sm" className="text-muted p-0 text-decoration-none" onClick={clearDraft}>
              Clear Draft
            </Button>
          </div>
        </div>

        <div className="auth-card" style={{ maxWidth: "100%", padding: "1.75rem" }}>
          <h4 className="fw-bold mb-1">Create a Post</h4>
          <p className="text-muted small mb-3">Share your ideas, media, poll, or link with PostHub.</p>

          {/* Post Type Selector Tabs */}
          <Nav variant="pills" className="mb-3 post-type-selector gap-1 p-1 bg-light rounded-3">
            <Nav.Item>
              <Nav.Link
                active={postType === "TEXT"}
                onClick={() => setPostType("TEXT")}
                className="d-flex align-items-center gap-1.5 py-1.5 px-3 small cursor-pointer"
              >
                <FiFileText /> Standard
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={postType === "POLL"}
                onClick={() => setPostType("POLL")}
                className="d-flex align-items-center gap-1.5 py-1.5 px-3 small cursor-pointer"
              >
                <FiPieChart /> Poll
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={postType === "LINK"}
                onClick={() => setPostType("LINK")}
                className="d-flex align-items-center gap-1.5 py-1.5 px-3 small cursor-pointer"
              >
                <FiLink /> Link
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Form onSubmit={handleSubmit}>
            {/* Title */}
            <Form.Group className="mb-3" controlId="postTitleInput">
              <Form.Label className="small text-muted mb-1">Title (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Give your post a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                disabled={loading}
              />
            </Form.Group>

            {/* Standard / Media Post Content */}
            <Form.Group className="mb-3" controlId="postContentInput">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="small text-muted mb-0">Content</Form.Label>
                <span className={`char-counter ${content.length > 1800 ? "near-limit" : ""}`}>
                  {content.length} / 2000
                </span>
              </div>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="What would you like to share? Use #hashtags and @mentions..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                disabled={loading}
              />
            </Form.Group>

            {/* Poll Creation Mode */}
            {postType === "POLL" && (
              <div className="poll-composer p-3 rounded-3 border bg-light-subtle mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Poll Question</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ask the community a question..."
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    maxLength={150}
                  />
                </Form.Group>

                <Form.Label className="small fw-semibold mb-2">Options</Form.Label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                    <Form.Control
                      type="text"
                      size="sm"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      maxLength={80}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemovePollOption(idx)}
                        className="py-1 px-2"
                      >
                        <FiX />
                      </Button>
                    )}
                  </div>
                ))}

                {pollOptions.length < 6 && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleAddPollOption}
                    className="mt-1"
                  >
                    + Add Option
                  </Button>
                )}
              </div>
            )}

            {/* Link Preview Mode */}
            {postType === "LINK" && (
              <div className="link-composer p-3 rounded-3 border bg-light-subtle mb-3">
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Destination URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://example.com/article"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Link Title (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="E.g., Understanding System Design"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-1">
                  <Form.Label className="small fw-semibold">Summary (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Brief description of the link..."
                    value={linkDesc}
                    onChange={(e) => setLinkDesc(e.target.value)}
                  />
                </Form.Group>
              </div>
            )}

            {/* Multiple Images Preview */}
            {imagePreviews.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="composer-preview-container position-relative" style={{ width: 120, height: 120 }}>
                    <img src={preview} alt={`Preview ${idx + 1}`} className="w-100 h-100 object-fit-cover rounded-2" />
                    <button
                      type="button"
                      className="composer-remove-img position-absolute top-0 end-0 m-1"
                      onClick={() => handleRemoveImage(idx)}
                      disabled={loading}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: "none" }}
              disabled={loading}
            />

            {/* Footer Buttons */}
            <div className="d-flex align-items-center justify-content-between pt-3 border-top">
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || imageFiles.length >= 4}
                className="d-flex align-items-center gap-1"
              >
                <FiImage /> {imageFiles.length > 0 ? `Add More (${imageFiles.length}/4)` : "Add Images"}
              </Button>

              <div className="d-flex align-items-center gap-2">
                <Button as={Link} to="/dashboard" variant="outline-secondary" size="sm" disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline-primary"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  className="btn-primary-custom d-flex align-items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" /> Publishing...
                    </>
                  ) : (
                    <>
                      <FiSend size={14} /> Publish Post
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
