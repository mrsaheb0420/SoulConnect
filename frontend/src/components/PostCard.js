import { useState } from "react";
import { postsAPI } from "../services/api";

export default function PostCard({ post, currentUser, onUpdate }) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Check if current user liked this post
  const isLiked = post.likes.some(like => like.user.toString() === currentUser?.id);

  const likePost = async () => {
    if (isLiking || !currentUser) return;

    setIsLiking(true);
    try {
      await postsAPI.likePost(post._id, currentUser.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to like post:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const addComment = async () => {
    if (!comment.trim() || isCommenting || !currentUser) return;

    setIsCommenting(true);
    try {
      await postsAPI.commentOnPost(post._id, currentUser.id, comment.trim());
      setComment("");
      setShowComments(true);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  const likeComment = async (commentId) => {
    if (!currentUser) return;

    try {
      await postsAPI.likeComment(post._id, commentId, currentUser.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const sharePost = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.user.username}`,
          text: post.text,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(`${post.text} - Posted by ${post.user.username}`);
        alert("Post link copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to share post:", error);
      // If share fails, still allow clipboard fallback if not already done
      if (!navigator.share) {
        alert("Failed to copy to clipboard");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const displayedComments = showAllComments ? post.comments : post.comments.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.user.profilePicture || "https://via.placeholder.com/48"}
            alt={`${post.user.username}'s avatar`}
            className="rounded-full w-12 h-12 border-2 border-gray-200 object-cover"
          />
          <div>
            <div className="flex items-center space-x-1">
              <h3 className="font-semibold text-gray-900">{post.user.username}</h3>
              {post.user.isVerified && (
                <span className="text-blue-500 text-sm">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{formatTime(post.createdAt)}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-2">
          ⋯
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{post.text}</p>
      </div>

      {/* Media Content */}
      {post.media && post.media.length > 0 && (
        <div className="px-4 pb-3">
          <div className={`grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : post.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
            {post.media.map((media, index) => (
              <div key={index} className="relative">
                {media.type === 'image' ? (
                  <img
                    src={`http://localhost:5000${media.url}`}
                    alt="Post media"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={`http://localhost:5000${media.url}`}
                    controls
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post Stats */}
      {(post.likes.length > 0 || post.comments.length > 0) && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            {post.likes.length > 0 && (
              <span className="flex items-center space-x-1">
                <span className="text-red-500">❤️</span>
                <span>{post.likes.length}</span>
              </span>
            )}
            {post.comments.length > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:text-blue-500 transition-colors"
              >
                {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex border-t border-gray-100">
        <button
          onClick={likePost}
          disabled={isLiking}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 hover:bg-gray-50 transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-600'
          }`}
        >
          <span className={isLiked ? 'text-red-500' : ''}>
            {isLiking ? '⏳' : isLiked ? '❤️' : '🤍'}
          </span>
          <span className="font-medium">Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center space-x-2 py-3 hover:bg-gray-50 transition-colors text-gray-600"
        >
          <span>💬</span>
          <span className="font-medium">Comment</span>
        </button>

        <button
          onClick={sharePost}
          disabled={isSharing}
          className="flex-1 flex items-center justify-center space-x-2 py-3 hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>↗️</span>
          <span className="font-medium">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 p-4">
          {/* Existing Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {displayedComments.map((c, i) => (
                <div key={c._id || i} className="flex space-x-3">
                  <img
                    src={c.user.profilePicture || "https://via.placeholder.com/32"}
                    alt={`${c.user.username}'s avatar`}
                    className="rounded-full w-8 h-8 flex-shrink-0 object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900">{c.user.username}</p>
                        <span className="text-xs text-gray-500">{formatTime(c.createdAt)}</span>
                      </div>
                      <p className="text-gray-800">{c.text}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 ml-4">
                      <button
                        onClick={() => likeComment(c._id)}
                        className={`text-xs hover:text-red-500 ${
                          c.likes.some(like => like.user.toString() === currentUser?.id) ? 'text-red-500' : 'text-gray-500'
                        }`}
                      >
                        Like {c.likes.length > 0 && `(${c.likes.length})`}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {post.comments.length > 3 && !showAllComments && (
                <button
                  onClick={() => setShowAllComments(true)}
                  className="text-blue-500 text-sm hover:text-blue-600 ml-11"
                >
                  View all {post.comments.length} comments
                </button>
              )}
            </div>
          )}

          {/* Add Comment */}
          {currentUser && (
            <div className="flex space-x-3">
              <img
                src={currentUser.profilePicture || "https://via.placeholder.com/32"}
                alt="Your avatar"
                className="rounded-full w-8 h-8 flex-shrink-0 object-cover"
              />
              <div className="flex-1 flex space-x-2">
                <input
                  className="flex-1 px-4 py-2 border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addComment()}
                />
                <button
                  onClick={addComment}
                  disabled={!comment.trim() || isCommenting}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    comment.trim() && !isCommenting
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isCommenting ? "..." : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
