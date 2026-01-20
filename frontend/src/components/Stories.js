import { useState, useEffect, useRef, useCallback } from "react";
import { storiesAPI, uploadAPI } from "../services/api";

export default function Stories({ currentUser }) {
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const storyTimeoutRef = useRef(null);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await storiesAPI.getStories(currentUser?.id);
      setStories(response.data);
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const createStory = async () => {
    if (!selectedFile || !currentUser) return;

    setIsUploading(true);
    try {
      // Upload media first
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await uploadAPI.uploadMedia(formData);
      const mediaUrl = uploadResponse.data.url;
      const mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';

      // Create story
      await storiesAPI.createStory({
        media: { url: mediaUrl, type: mediaType },
        text: caption.trim(),
        userId: currentUser.id
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      setShowCreateStory(false);

      // Refresh stories
      fetchStories();
    } catch (error) {
      console.error("Failed to create story:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const viewStory = (storyUser, startIndex = 0) => {
    const userStories = stories.filter(story => story.user._id === storyUser._id);
    setSelectedStory({ user: storyUser, stories: userStories });
    setCurrentStoryIndex(startIndex);
  };

  const nextStory = useCallback(() => {
    if (!selectedStory) return;

    if (currentStoryIndex < selectedStory.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      closeStoryViewer();
    }
  }, [selectedStory, currentStoryIndex]);

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const closeStoryViewer = () => {
    setSelectedStory(null);
    setCurrentStoryIndex(0);
    if (storyTimeoutRef.current) {
      clearTimeout(storyTimeoutRef.current);
    }
  };

  const handleStoryClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 2) {
      prevStory();
    } else {
      nextStory();
    }
  };

  // Auto-advance stories
  useEffect(() => {
    if (selectedStory && selectedStory.stories[currentStoryIndex]) {
      storyTimeoutRef.current = setTimeout(() => {
        nextStory();
      }, 5000); // 5 seconds per story
    }

    return () => {
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
      }
    };
  }, [selectedStory, currentStoryIndex, nextStory]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.user._id;
    if (!acc[userId]) {
      acc[userId] = {
        user: story.user,
        stories: [],
        hasUnviewed: false
      };
    }
    acc[userId].stories.push(story);
    return acc;
  }, {});

  const storyUsers = Object.values(groupedStories);

  if (loading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {/* Create Story Button */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div
                onClick={() => setShowCreateStory(true)}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              >
                <span className="text-white text-2xl">+</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-xs">+</span>
              </div>
            </div>
            <p className="text-xs text-center mt-1 text-gray-600">Your story</p>
          </div>

          {/* User Stories */}
          {storyUsers.map(({ user, stories: userStories, hasUnviewed }) => (
            <div key={user._id} className="flex-shrink-0">
              <div
                onClick={() => viewStory(user)}
                className={`relative cursor-pointer hover:scale-105 transition-transform ${
                  hasUnviewed ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                <img
                  src={user.profilePicture || "https://via.placeholder.com/64"}
                  alt={`${user.username}'s story`}
                  className="w-16 h-16 rounded-full border-2 border-gray-300 object-cover"
                />
                {hasUnviewed && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <p className="text-xs text-center mt-1 text-gray-600 truncate w-16">
                {user.username}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Story Modal */}
      {showCreateStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create Story</h3>
                <button
                  onClick={() => {
                    setShowCreateStory(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setCaption("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4">
              {!previewUrl ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-600">Click to add photo or video</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    {selectedFile?.type.startsWith('image/') ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full rounded-lg"
                      />
                    ) : (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full rounded-lg"
                      />
                    )}
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                    >
                      ✕
                    </button>
                  </div>

                  <textarea
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />

                  <button
                    onClick={createStory}
                    disabled={isUploading}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      isUploading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {isUploading ? "Creating..." : "Share to Story"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full max-w-md mx-auto">
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="flex space-x-1">
                {selectedStory.stories.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full bg-white transition-all duration-100 ${
                        index < currentStoryIndex ? 'w-full' :
                        index === currentStoryIndex ? 'animate-pulse w-full' : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={closeStoryViewer}
              className="absolute top-4 right-4 z-10 text-white text-2xl hover:text-gray-300"
            >
              ✕
            </button>

            {/* Story User Info */}
            <div className="absolute top-12 left-4 right-4 z-10 flex items-center space-x-3">
              <img
                src={selectedStory.user.profilePicture || "https://via.placeholder.com/32"}
                alt={`${selectedStory.user.username}'s avatar`}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
              <div className="text-white">
                <p className="font-semibold text-sm">{selectedStory.user.username}</p>
                <p className="text-xs opacity-80">
                  {formatTime(selectedStory.stories[currentStoryIndex]?.createdAt)}
                </p>
              </div>
            </div>

            {/* Story Content */}
            <div
              className="w-full h-full cursor-pointer"
              onClick={handleStoryClick}
            >
              {selectedStory.stories[currentStoryIndex] && (
                <div className="w-full h-full flex items-center justify-center">
                  {selectedStory.stories[currentStoryIndex].media?.type === 'image' ? (
                    <img
                      src={`http://localhost:5000${selectedStory.stories[currentStoryIndex].media.url}`}
                      alt="Story"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video
                      src={`http://localhost:5000${selectedStory.stories[currentStoryIndex].media.url}`}
                      autoPlay
                      muted
                      className="max-w-full max-h-full object-contain"
                    />
                  )}

                  {/* Caption */}
                  {selectedStory.stories[currentStoryIndex].caption && (
                    <div className="absolute bottom-20 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
                      <p className="text-sm">{selectedStory.stories[currentStoryIndex].caption}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Hints */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-60">
              Tap to navigate • {currentStoryIndex + 1} of {selectedStory.stories.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
