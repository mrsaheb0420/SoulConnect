import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { profileAPI, uploadAPI } from "../services/api";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    location: "",
    website: "",
    profilePicture: null
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const loadProfile = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      // Load user profile data
      const userResponse = await profileAPI.getProfile(userId);
      setUser(userResponse.data.user);
      setPosts(userResponse.data.posts);

      // Check if current user is following this profile
      if (currentUser && userResponse.data.user.followers) {
        setIsFollowing(userResponse.data.user.followers.some(follower => follower._id === currentUser.id));
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Load current user
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Use currentUser if no userId in params (own profile)
  const profileUserId = userId || currentUser?.id;

  useEffect(() => {
    if (profileUserId && currentUser) {
      loadProfile(profileUserId);
    }
  }, [profileUserId, currentUser, loadProfile]);

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const response = await profileAPI.followUser(profileUserId, currentUser.id);
      setIsFollowing(response.data.isFollowing);
      setUser(prev => ({
        ...prev,
        followersCount: response.data.followersCount,
        followingCount: response.data.followingCount
      }));
    } catch (error) {
      console.error("Failed to follow/unfollow:", error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setEditForm(prev => ({ ...prev, profilePicture: file }));
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  };

  const handleEditProfile = async () => {
    setIsUpdating(true);
    try {
      let profilePictureUrl = user.profilePicture;

      // Upload new profile picture if selected
      if (editForm.profilePicture) {
        const formData = new FormData();
        formData.append('file', editForm.profilePicture);

        const uploadResponse = await uploadAPI.uploadMedia(formData);
        profilePictureUrl = uploadResponse.data.url;
      }

      // Update profile
      await profileAPI.updateProfile(profileUserId, {
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
        profilePicture: profilePictureUrl
      });

      // Update local user state
      setUser(prev => ({
        ...prev,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
        profilePicture: profilePictureUrl
      }));

      // Update currentUser if editing own profile
      if (currentUser && currentUser.id === profileUserId) {
        // This would typically be handled by a global state management solution
        // For now, we'll just close the modal
      }

      setIsEditModalOpen(false);
      setEditForm({ bio: "", profilePicture: null });
      setPreviewImage(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      profilePicture: null
    });
    setPreviewImage(null);
    setIsEditModalOpen(true);
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const isOwnProfile = currentUser && currentUser.id === profileUserId;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
            <p className="text-gray-600">The user you're looking for doesn't exist.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="pt-4 pb-20 md:pb-4 md:pt-20 max-w-4xl mx-auto px-4">

        {/* Cover Image */}
        <div className="relative mb-6">
          <div className="h-48 md:h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1557683316-973673baf926?w=800"
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>

          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <img
                src={user.profilePicture || "https://via.placeholder.com/128"}
                alt={`${user.username}'s profile`}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {isOwnProfile && (
                <button
                  onClick={openEditModal}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 shadow-md hover:bg-blue-600 transition-colors"
                >
                  📷
                </button>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="absolute top-4 right-4">
            {isOwnProfile ? (
              <button
                onClick={openEditModal}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium shadow-md hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/chat/${profileUserId}`)}
                  className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium shadow-md hover:bg-gray-200 transition-colors"
                >
                  💬 Message
                </button>
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-lg font-medium shadow-md transition-colors ${
                    isFollowing
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-16 mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {user.username}
                </h1>
                {user.isVerified && (
                  <span className="text-blue-500 text-xl">✓</span>
                )}
              </div>
              <p className="text-gray-600 mb-2">{user.bio || "No bio yet"}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {user.location && <span>📍 {user.location}</span>}
                {user.website && <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">🔗 Website</a>}
                <span>📅 Joined {formatJoinDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.postsCount || 0}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.followersCount || 0}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.followingCount || 0}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex">
            {[
              { id: "posts", label: "Posts", icon: "📝" },
              { id: "photos", label: "Photos", icon: "📸" },
              { id: "videos", label: "Videos", icon: "🎥" },
              { id: "likes", label: "Likes", icon: "❤️" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "posts" && (
            <>
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
                  <p className="text-gray-500">Share your first post to get started!</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUser={currentUser}
                    onUpdate={loadProfile}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "photos" && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Photo Gallery</h3>
              <p className="text-gray-500">Photos will appear here</p>
            </div>
          )}

          {activeTab === "videos" && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Video Gallery</h3>
              <p className="text-gray-500">Videos will appear here</p>
            </div>
          )}

          {activeTab === "likes" && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❤️</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Liked Posts</h3>
              <p className="text-gray-500">Posts you've liked will appear here</p>
            </div>
          )}
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Profile</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Profile Picture */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={previewImage || user.profilePicture || "https://via.placeholder.com/128"}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                  >
                    📷
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-sm text-gray-600">Click the camera to change your profile picture</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  maxLength="160"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editForm.bio.length}/160 characters
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Where are you located?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="50"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProfile}
                  disabled={isUpdating}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    isUpdating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
