import { useEffect, useState, useRef, useCallback } from "react";
import { postsAPI, uploadAPI, storiesAPI } from "../services/api";
import Navbar from "../components/Navbar";
import Stories from "../components/Stories";
import PostCard from "../components/PostCard";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [text, setText] = useState("");
  const [media, setMedia] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const fileInputRef = useRef(null);

  // Load current user
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else {
      if (token) {
        // Token exists but no user, clear and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const res = await postsAPI.getFeed({
        userId: currentUser?.id,
        page,
        limit: 10
      });
      if (page === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts(prev => [...prev, ...res.data.posts]);
      }
      setHasNextPage(res.data.pagination.hasNext);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, page]);

  const loadStories = useCallback(async () => {
    try {
      const res = await storiesAPI.getStories(currentUser?.id);
      setStories(res.data);
    } catch (error) {
      console.error("Failed to load stories:", error);
    }
  }, [currentUser]);

  // Load posts and stories
  useEffect(() => {
    if (currentUser) {
      loadPosts();
      loadStories();
    }
  }, [currentUser, page, loadPosts, loadStories]);

  // Handle media file selection
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    const uploadedMedia = [];

    for (const file of files) {
      try {
        const res = await uploadAPI.uploadMedia(file);
        uploadedMedia.push(res.data);
      } catch (error) {
        console.error("Failed to upload media:", error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setMedia(prev => [...prev, ...uploadedMedia]);
  };

  // Create new post
  const createPost = async () => {
    if (!text.trim() && media.length === 0) return;

    setIsPosting(true);
    try {
      await postsAPI.createPost({
        userId: currentUser.id,
        text: text.trim(),
        media: media.map(m => ({ url: m.url, type: m.type }))
      });

      // Reset form
      setText("");
      setMedia([]);

      // Refresh posts
      setPage(1);
      loadPosts();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  // Remove media from post
  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Handle post updates (likes, comments)
  const handlePostUpdate = () => {
    loadPosts();
  };

  // Load more posts
  const loadMorePosts = () => {
    if (hasNextPage && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto pt-20 px-4 pb-8">
        {/* Stories Section */}
        <div className="mb-6">
          <Stories stories={stories} currentUser={currentUser} onUpdate={loadStories} />
        </div>

        {/* Create Post Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex space-x-3">
            <img
              src={currentUser.profilePicture || "https://via.placeholder.com/40"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />

              {/* Media Preview */}
              {media.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {media.map((item, index) => (
                    <div key={index} className="relative">
                      {item.type === 'image' ? (
                        <img
                          src={`http://localhost:5000${item.url}`}
                          alt="Upload preview"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={`http://localhost:5000${item.url}`}
                          className="w-20 h-20 object-cover rounded-lg"
                          controls
                        />
                      )}
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span>📷</span>
                    <span className="text-sm">Photo/Video</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50">
                    <span>😊</span>
                    <span className="text-sm">Feeling</span>
                  </button>
                </div>

                <button
                  onClick={createPost}
                  disabled={isPosting || (!text.trim() && media.length === 0)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? "Posting..." : "Post"}
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={currentUser}
              onUpdate={handlePostUpdate}
            />
          ))}

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {hasNextPage && !isLoading && (
            <div className="text-center">
              <button
                onClick={loadMorePosts}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                Load More Posts
              </button>
            </div>
          )}

          {posts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600">Be the first to share something with your friends!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
