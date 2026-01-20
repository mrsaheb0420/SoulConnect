import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (userData) => API.post("/auth/register", userData),
  login: (credentials) => API.post("/auth/login", credentials),
  verify: () => API.get("/auth/verify"),
};

// Posts endpoints
export const postsAPI = {
  createPost: (postData) => API.post("/posts", postData),
  getFeed: (params) => API.get("/posts", { params }),
  getPost: (postId) => API.get(`/posts/${postId}`),
  likePost: (postId, userId) => API.put(`/posts/like/${postId}`, { userId }),
  commentOnPost: (postId, userId, text) => API.post(`/posts/comment/${postId}`, { userId, text }),
  likeComment: (postId, commentId, userId) => API.put(`/posts/comment/${postId}/${commentId}/like`, { userId }),
  deletePost: (postId, userId) => API.delete(`/posts/${postId}`, { data: { userId } }),
  searchPosts: (query) => API.get(`/posts/search/${query}`),
  getUserPosts: (userId, params) => API.get(`/posts/user/${userId}`, { params }),
};

// Profile endpoints
export const profileAPI = {
  getProfile: (userId) => API.get(`/profile/${userId}`),
  updateProfile: (userId, profileData) => API.put(`/profile/${userId}`, profileData),
  followUser: (userId, currentUserId) => API.put(`/profile/${userId}/follow`, { userId: currentUserId }),
  unfollowUser: (userId, currentUserId) => API.put(`/profile/${userId}/follow`, { userId: currentUserId }), // Same as follow, backend toggles
  getFollowers: (userId) => API.get(`/profile/${userId}/followers`),
  getFollowing: (userId) => API.get(`/profile/${userId}/following`),
  searchUsers: (query) => API.get(`/profile/search/${query}`),
};

// Stories endpoints
export const storiesAPI = {
  createStory: (storyData) => API.post("/story", storyData),
  updateStory: (storyId, storyData) => API.put(`/story/${storyId}`, storyData),
  getStories: (userId) => API.get("/story", { params: { userId } }),
  viewStory: (storyId, userId) => API.put(`/story/${storyId}/view`, { userId }),
  likeStory: (storyId, userId) => API.put(`/story/${storyId}/like`, { userId }),
  deleteStory: (storyId, userId) => API.delete(`/story/${storyId}`, { data: { userId } }),
};

// Chat endpoints
export const chatAPI = {
  sendMessage: (messageData) => API.post("/chat/send", messageData),
  getConversation: (userId, otherUserId, params) => API.get(`/chat/conversation/${userId}/${otherUserId}`, { params }),
  getConversations: (userId) => API.get(`/chat/conversations/${userId}`),
  markAsRead: (conversationId, userId) => API.put(`/chat/conversation/${conversationId}/read`, { userId }),
  deleteMessage: (messageId, userId) => API.delete(`/chat/message/${messageId}`, { data: { userId } }),
};

// Notifications endpoints
export const notificationsAPI = {
  getNotifications: (userId, params) => API.get(`/notifications/${userId}`, { params }),
  markAsRead: (notificationId) => API.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => API.put(`/notifications/${userId}/read-all`),
  deleteNotification: (notificationId) => API.delete(`/notifications/${notificationId}`),
};

// Upload endpoints
export const uploadAPI = {
  uploadMedia: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post("/uploads/media", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteMedia: (filename) => API.delete(`/uploads/media/${filename}`),
};

export default API;
