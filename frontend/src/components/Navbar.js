import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { notificationsAPI, profileAPI } from "../services/api";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Load current user
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        loadNotifications(user.id);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
      }
    }
  }, []);

  const loadNotifications = async (userId) => {
    try {
      const response = await notificationsAPI.getNotifications(userId, { limit: 10 });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await profileAPI.searchUsers(query);
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { path: "/", icon: "🏠", label: "Home" },
    { path: "/chat", icon: "💬", label: "Messages" },
    { path: "/profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white border-t z-50 md:top-0 md:bottom-auto md:border-b">
      {/* Desktop Navbar */}
      <div className="hidden md:block max-w-5xl mx-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            SoulConnect
          </Link>

          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                value={searchQuery}
                onChange={handleSearchInput}
                className="border rounded-full px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                placeholder="Search people..."
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <Link
                      key={user._id}
                      to={`/profile/${user._id}`}
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchResults(false);
                      }}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={user.profilePicture || "https://via.placeholder.com/32"}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.bio || "No bio"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="text-4xl mb-2">🔔</div>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => markAsRead(notif._id)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notif.isRead ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <img
                              src={notif.sender?.profilePicture || "https://via.placeholder.com/32"}
                              alt={notif.sender?.username}
                              className="rounded-full w-8 h-8 object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-semibold">{notif.sender?.username}</span> {notif.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 text-center border-t border-gray-200">
                    <button
                      onClick={() => navigate("/notifications")}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <img
              src="https://i.pravatar.cc/40"
              alt="profile"
              className="rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500"
            />
            <button
              className="text-sm text-red-500 hover:text-red-700"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-white border-t">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
