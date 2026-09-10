import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Modal, Form, Spinner, Badge, Nav, Dropdown } from "react-bootstrap";
import { 
  FiMapPin, 
  FiGlobe, 
  FiGithub, 
  FiTwitter, 
  FiLinkedin, 
  FiCamera, 
  FiEdit, 
  FiUserPlus, 
  FiUserCheck, 
  FiCheckCircle, 
  FiFileText, 
  FiImage, 
  FiBookmark,
  FiSlash,
  FiVolumeX,
  FiVolume2,
  FiUsers,
  FiMoreHorizontal,
  FiBarChart2
} from "react-icons/fi";
import { 
  getProfileByUsername, 
  updateProfile, 
  uploadAvatar, 
  uploadCover, 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing,
  blockUser,
  unblockUser,
  muteUser,
  unmuteUser
} from "../services/users";
import { getPosts, getSavedPosts } from "../services/posts";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import PostCard from "../components/PostCard";
import ProfileSkeleton from "../components/ProfileSkeleton";
import PostSkeleton from "../components/PostSkeleton";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { getInitials } from "../utils/initials";

export default function Profile() {
  const { username: paramUsername } = useParams();
  const { user: currentUser, setUser: setContextUser } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const targetUsername = paramUsername || currentUser?.username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts"); // posts, media, saved
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    skillsStr: "",
    github: "",
    twitter: "",
    linkedin: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Follow list modal (followers / following)
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState("followers"); // followers or following
  const [followList, setFollowList] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  // Follow action state
  const [followPending, setFollowPending] = useState(false);

  const isOwnProfile = Boolean(
    currentUser &&
    profile &&
    (currentUser._id === profile._id || currentUser.username === profile.username)
  );

  const loadProfile = useCallback(async () => {
    if (!targetUsername) return;
    setLoading(true);
    try {
      const res = await getProfileByUsername(targetUsername);
      const data = res.data?.data;
      setProfile(data);
      if (data) {
        setEditData({
          name: data.name || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
          skillsStr: (data.skills || []).join(", "),
          github: data.socialLinks?.github || "",
          twitter: data.socialLinks?.twitter || "",
          linkedin: data.socialLinks?.linkedin || "",
        });
      }
    } catch {
      showToast("Failed to load profile.", "danger");
    } finally {
      setLoading(false);
    }
  }, [targetUsername, showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load user posts or saved posts
  const loadTabContent = useCallback(async () => {
    if (!profile) return;
    setPostsLoading(true);
    try {
      if (activeTab === "saved" && isOwnProfile) {
        const res = await getSavedPosts();
        setUserPosts(res.data?.data?.posts || []);
      } else {
        const res = await getPosts({ authorId: profile._id });
        let list = res.data?.data?.posts || [];
        if (activeTab === "media") {
          list = list.filter((p) => p.image || (p.media && p.media.length > 0));
        }
        setUserPosts(list);
      }
    } catch {
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [profile, activeTab, isOwnProfile]);

  useEffect(() => {
    loadTabContent();
  }, [loadTabContent]);

  // Handle Follow / Unfollow
  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (followPending || !profile) return;

    setFollowPending(true);
    const currentlyFollowing = profile.isFollowing;

    // Optimistic UI update
    setProfile((prev) => ({
      ...prev,
      isFollowing: !currentlyFollowing,
      followersCount: Math.max(0, (prev.followersCount || 0) + (!currentlyFollowing ? 1 : -1)),
    }));

    try {
      if (currentlyFollowing) {
        await unfollowUser(profile._id);
        showToast(`Unfollowed @${profile.username}`, "info", 1500);
      } else {
        await followUser(profile._id);
        showToast(`Following @${profile.username}`, "success", 1500);
      }
    } catch (err) {
      // Revert on error
      setProfile((prev) => ({
        ...prev,
        isFollowing: currentlyFollowing,
        followersCount: Math.max(0, (prev.followersCount || 0) + (currentlyFollowing ? 1 : -1)),
      }));
      showToast(err.response?.data?.message || "Failed to update follow status.", "danger");
    } finally {
      setFollowPending(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!profile) return;
    try {
      if (profile.isBlocked) {
        await unblockUser(profile._id);
        setProfile((prev) => ({ ...prev, isBlocked: false }));
        showToast(`Unblocked @${profile.username}`, "info");
      } else {
        if (window.confirm(`Are you sure you want to block @${profile.username}? They will no longer be able to follow or view your posts.`)) {
          await blockUser(profile._id);
          setProfile((prev) => ({ ...prev, isBlocked: true, isFollowing: false }));
          showToast(`Blocked @${profile.username}`, "warning");
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "danger");
    }
  };

  const handleMuteToggle = async () => {
    if (!profile) return;
    try {
      if (profile.isMuted) {
        await unmuteUser(profile._id);
        setProfile((prev) => ({ ...prev, isMuted: false }));
        showToast(`Unmuted @${profile.username}`, "info");
      } else {
        await muteUser(profile._id);
        setProfile((prev) => ({ ...prev, isMuted: true }));
        showToast(`Muted @${profile.username}`, "warning");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "danger");
    }
  };


  // Open Follow List Modal
  const handleOpenFollowList = async (type) => {
    setFollowModalType(type);
    setShowFollowModal(true);
    setLoadingFollowList(true);
    try {
      const res = type === "followers" ? await getFollowers(profile._id) : await getFollowing(profile._id);
      setFollowList(res.data?.data?.users || []);
    } catch {
      setFollowList([]);
    } finally {
      setLoadingFollowList(false);
    }
  };

  // Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      showToast("Uploading profile photo...", "info", 2000);
      const res = await uploadAvatar(formData);
      if (res.data?.data) {
        setProfile((prev) => ({ ...prev, avatar: res.data.data.avatar }));
        setContextUser((prev) => ({ ...prev, avatar: res.data.data.avatar }));
        showToast("Profile photo updated!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload avatar.", "danger");
    }
  };

  // Cover Upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("coverImage", file);

    try {
      showToast("Uploading cover image...", "info", 2000);
      const res = await uploadCover(formData);
      if (res.data?.data) {
        setProfile((prev) => ({ ...prev, coverImage: res.data.data.coverImage }));
        showToast("Cover photo updated!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload cover.", "danger");
    }
  };

  // Save Profile Edit
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const skills = editData.skillsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: editData.name.trim(),
        bio: editData.bio.trim(),
        location: editData.location.trim(),
        website: editData.website.trim(),
        skills,
        socialLinks: {
          github: editData.github.trim(),
          twitter: editData.twitter.trim(),
          linkedin: editData.linkedin.trim(),
        },
      };

      const res = await updateProfile(payload);
      if (res.data?.data) {
        setProfile((prev) => ({ ...prev, ...res.data.data }));
        setContextUser((prev) => ({ ...prev, name: res.data.data.name }));
        setShowEditModal(false);
        showToast("Profile updated successfully!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile.", "danger");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="py-3">
        <Container style={{ maxWidth: "1100px" }}>
          <ProfileSkeleton />
        </Container>
      </div>
    );
  }

  if (!profile) {
    return (
      <Container className="py-5 text-center">
        <EmptyState
          title="User not found"
          description="The user you are looking for does not exist or has been removed."
          actionText="Back to Feed"
          actionLink="/dashboard"
        />
      </Container>
    );
  }

  const initial = getInitials(profile.name);

  return (
    <div className="profile-page">
      <Container style={{ maxWidth: "1100px" }}>
        {/* Cover Photo Header */}
        <div
          className={`profile-cover position-relative rounded-4 overflow-hidden border shadow-sm ${!profile.coverImage ? "profile-cover-fallback" : ""}`}
          style={{
            height: "220px",
            backgroundImage: profile.coverImage ? `url(${profile.coverImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {isOwnProfile && (
            <button
              type="button"
              className="btn btn-sm btn-dark bg-opacity-75 position-absolute top-0 end-0 m-3 d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5"
              onClick={() => coverInputRef.current?.click()}
            >
              <FiCamera size={14} /> Change Cover
            </button>
          )}
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverUpload}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>

        {/* Profile Card & Info */}
        <div className="profile-card bg-body rounded-4 p-4 mb-4 border shadow-sm position-relative" style={{ marginTop: "-60px" }}>
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-3 mb-3">
            {/* Avatar */}
            <div className="position-relative">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="rounded-circle border border-4 border-body object-fit-cover shadow-sm"
                  style={{ width: "110px", height: "110px" }}
                />
              ) : (
                <div
                  className="avatar-placeholder rounded-circle border border-4 border-body d-flex align-items-center justify-content-center bg-primary text-white fw-bold shadow-sm"
                  style={{ width: "110px", height: "110px", fontSize: "2.5rem" }}
                >
                  {initial}
                </div>
              )}

              {isOwnProfile && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center shadow"
                  style={{ width: "32px", height: "32px", padding: 0 }}
                  onClick={() => avatarInputRef.current?.click()}
                  title="Update profile picture"
                >
                  <FiCamera size={14} />
                </button>
              )}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>

            {/* Profile Action Buttons */}
            <div>
              {isOwnProfile ? (
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5"
                  onClick={() => setShowEditModal(true)}
                >
                  <FiEdit /> Edit Profile
                </Button>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant={profile.isFollowing ? "outline-secondary" : "primary"}
                    className="d-flex align-items-center gap-1.5 rounded-pill px-4 py-1.5 fw-medium"
                    onClick={handleFollowToggle}
                    disabled={followPending}
                  >
                    {profile.isFollowing ? (
                      <>
                        <FiUserCheck /> Following
                      </>
                    ) : (
                      <>
                        <FiUserPlus /> Follow
                      </>
                    )}
                  </Button>

                  <Dropdown align="end">
                    <Dropdown.Toggle variant="outline-secondary" size="sm" className="rounded-circle p-1.5 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                      <FiMoreHorizontal />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={handleMuteToggle} className="d-flex align-items-center gap-2">
                        {profile.isMuted ? <><FiVolume2 /> Unmute @{profile.username}</> : <><FiVolumeX /> Mute @{profile.username}</>}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={handleBlockToggle} className="d-flex align-items-center gap-2 text-danger">
                        <FiSlash /> {profile.isBlocked ? `Unblock @${profile.username}` : `Block @${profile.username}`}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              )}
            </div>
          </div>

          {/* User Names & Badges */}
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold mb-0">{profile.name}</h4>
              {profile.isVerified && <FiCheckCircle className="text-primary" size={18} title="Verified Creator" />}
              {profile.role && profile.role !== "user" && (
                <Badge bg="warning" text="dark" className="text-capitalize small fw-semibold">
                  {profile.role}
                </Badge>
              )}
            </div>
            <span className="text-muted">@{profile.username}</span>

            {/* Mutual Followers */}
            {profile.mutualFollowers && profile.mutualFollowers.length > 0 && (
              <div className="text-muted small d-flex align-items-center gap-1.5 mt-1">
                <FiUsers className="text-primary" size={14} />
                <span>
                  Followed by{" "}
                  <strong>{profile.mutualFollowers.map((m) => m.name).join(", ")}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && <p className="profile-bio mb-3 text-body" style={{ whiteSpace: "pre-line" }}>{profile.bio}</p>}

          {/* Metadata: Location, Website, Socials */}
          <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-3">
            {profile.location && (
              <span className="d-flex align-items-center gap-1">
                <FiMapPin /> {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center gap-1 text-primary text-decoration-none"
              >
                <FiGlobe /> {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile.socialLinks?.github && (
              <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted text-decoration-none hover-primary">
                <FiGithub size={15} /> GitHub
              </a>
            )}
            {profile.socialLinks?.twitter && (
              <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted text-decoration-none hover-primary">
                <FiTwitter size={15} /> Twitter
              </a>
            )}
            {profile.socialLinks?.linkedin && (
              <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted text-decoration-none hover-primary">
                <FiLinkedin size={15} /> LinkedIn
              </a>
            )}
          </div>

          {/* Skills Badges */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="d-flex flex-wrap gap-1.5 mb-3">
              {profile.skills.map((skill, idx) => (
                <Badge key={idx} bg="light" text="dark" className="border px-2 py-1 small fw-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {/* Follow Counts */}
          <div className="d-flex align-items-center gap-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none text-body"
              onClick={() => handleOpenFollowList("following")}
            >
              <strong>{profile.followingCount || 0}</strong> <span className="text-muted">Following</span>
            </button>
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none text-body"
              onClick={() => handleOpenFollowList("followers")}
            >
              <strong>{profile.followersCount || 0}</strong> <span className="text-muted">Followers</span>
            </button>
            <span>
              <strong>{profile.postsCount || 0}</strong> <span className="text-muted">Posts</span>
            </span>
          </div>
        </div>

        {/* Profile Content Tabs */}
        <div className="feed-tabs-container mb-4">
          <div className="feed-tabs-scroll" role="tablist" aria-label="Profile content tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "posts"}
              className={`feed-tab-btn ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              <FiFileText size={15} /> <span>Posts</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "media"}
              className={`feed-tab-btn ${activeTab === "media" ? "active" : ""}`}
              onClick={() => setActiveTab("media")}
            >
              <FiImage size={15} /> <span>Media</span>
            </button>
            {isOwnProfile && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "saved"}
                className={`feed-tab-btn ${activeTab === "saved" ? "active" : ""}`}
                onClick={() => setActiveTab("saved")}
              >
                <FiBookmark size={15} /> <span>Saved</span>
              </button>
            )}
            {isOwnProfile && (
              <button
                type="button"
                className="feed-tab-btn"
                onClick={() => navigate("/creator")}
              >
                <FiBarChart2 size={15} /> <span>Analytics</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {postsLoading ? (
          <div className="d-flex flex-column gap-3">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : userPosts.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} yet`}
            message={
              isOwnProfile
                ? "You haven't shared anything in this category yet."
                : `@${profile.username} has not posted any ${activeTab} yet.`
            }
            actionText={isOwnProfile && activeTab === "posts" ? "Create Post" : undefined}
            actionLink={isOwnProfile && activeTab === "posts" ? "/create-post" : undefined}
          />
        ) : (
          <div className="d-flex flex-column gap-3">
            {userPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser}
                onDeletePost={(id) => setUserPosts((prev) => prev.filter((p) => p._id !== id))}
              />
            ))}
          </div>
        )}
      </Container>

      {/* Edit Profile Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">Edit Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveProfile}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group controlId="editName">
                  <Form.Label className="small fw-semibold">Display Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group controlId="editBio">
                  <Form.Label className="small fw-semibold">Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Tell the community about yourself..."
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    maxLength={300}
                  />
                  <div className="text-end small text-muted mt-1">{editData.bio.length}/300</div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="editLocation">
                  <Form.Label className="small fw-semibold">Location</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="City, Country"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="editWebsite">
                  <Form.Label className="small fw-semibold">Website</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://yoursite.com"
                    value={editData.website}
                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group controlId="editSkills">
                  <Form.Label className="small fw-semibold">Skills (Comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="React, Node.js, Cloud Architecture, UI/UX"
                    value={editData.skillsStr}
                    onChange={(e) => setEditData({ ...editData, skillsStr: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="editGithub">
                  <Form.Label className="small fw-semibold">GitHub URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://github.com/username"
                    value={editData.github}
                    onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="editTwitter">
                  <Form.Label className="small fw-semibold">Twitter/X URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://twitter.com/username"
                    value={editData.twitter}
                    onChange={(e) => setEditData({ ...editData, twitter: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="editLinkedin">
                  <Form.Label className="small fw-semibold">LinkedIn URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={editData.linkedin}
                    onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={savingProfile}>
              {savingProfile ? <Spinner size="sm" animation="border" /> : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Followers / Following List Modal */}
      <Modal show={showFollowModal} onHide={() => setShowFollowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold text-capitalize">{followModalType}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {loadingFollowList ? (
            <div className="py-4 text-center">
              <Spinner size="sm" animation="border" />
            </div>
          ) : followList.length === 0 ? (
            <p className="p-4 text-center text-muted small mb-0">No users found.</p>
          ) : (
            <div className="list-group list-group-flush">
              {followList.map((u) => (
                <div
                  key={u._id}
                  className="list-group-item d-flex align-items-center justify-content-between p-3"
                >
                  <div
                    className="d-flex align-items-center gap-2.5 cursor-pointer"
                    onClick={() => {
                      setShowFollowModal(false);
                      navigate(`/profile/${u.username}`);
                    }}
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="rounded-circle object-fit-cover" style={{ width: 38, height: 38 }} />
                    ) : (
                      <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 38, height: 38 }}>
                        {(u.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="fw-semibold small">{u.name}</div>
                      <div className="text-muted small" style={{ fontSize: "12px" }}>@{u.username}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
