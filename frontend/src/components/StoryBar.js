import { useEffect, useState } from "react";
import API from "../services/api";

export default function StoryBar() {
  const [stories, setStories] = useState([]);
  const [text, setText] = useState("");
  const [showCreateStory, setShowCreateStory] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const res = await API.get("/story");
      setStories(res.data);
    } catch (error) {
      console.error("Failed to load stories:", error);
    }
  };

  const addStory = async () => {
    if (!text.trim()) return;

    try {
      await API.post("/story", {
        user: "user1",
        text: text.trim()
      });
      setText("");
      setShowCreateStory(false);
      loadStories();
    } catch (error) {
      console.error("Failed to add story:", error);
    }
  };

  const storyUsers = [
    { id: "your", name: "Your Story", avatar: "https://i.pravatar.cc/64", isOwn: true },
    ...stories.slice(0, 8).map((story, index) => ({
      id: story._id,
      name: story.user,
      avatar: `https://i.pravatar.cc/64?u=${story.user}`,
      isOwn: false
    }))
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Stories</h2>
        <button
          onClick={() => setShowCreateStory(!showCreateStory)}
          className="text-blue-500 hover:text-blue-600 font-medium text-sm"
        >
          + Add Story
        </button>
      </div>

      {/* Create Story Modal */}
      {showCreateStory && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl">
          <div className="flex items-center space-x-3">
            <img
              src="https://i.pravatar.cc/48"
              alt="Your avatar"
              className="rounded-full w-12 h-12 border-2 border-white"
            />
            <div className="flex-1">
              <input
                className="w-full px-4 py-2 rounded-full bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="What's your story?"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addStory()}
              />
            </div>
            <button
              onClick={addStory}
              disabled={!text.trim()}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                text.trim()
                  ? "bg-white text-purple-600 hover:bg-gray-100"
                  : "bg-white/50 text-white/50 cursor-not-allowed"
              }`}
            >
              Share
            </button>
          </div>
        </div>
      )}

      {/* Stories List */}
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {storyUsers.map((user) => (
          <div
            key={user.id}
            className={`flex-shrink-0 text-center cursor-pointer group ${
              user.isOwn ? 'relative' : ''
            }`}
          >
            <div className={`relative ${user.isOwn ? 'p-0.5 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full' : ''}`}>
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                user.isOwn
                  ? 'border-white bg-white p-0.5'
                  : 'border-gray-200 group-hover:border-blue-300'
              } transition-colors`}>
                <img
                  src={user.avatar}
                  alt={`${user.name}'s story`}
                  className="w-full h-full rounded-full object-cover"
                />
                {user.isOwn && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    +
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 max-w-16 truncate">
              {user.isOwn ? 'Your story' : user.name}
            </p>
          </div>
        ))}

        {stories.length > 8 && (
          <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
            <span className="text-gray-500 font-bold">+</span>
          </div>
        )}
      </div>

      {/* Story Preview */}
      {stories.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            {stories.length} active stor{stories.length !== 1 ? 'ies' : 'y'} • Tap to view
          </p>
        </div>
      )}
    </div>
  );
}
