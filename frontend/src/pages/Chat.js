import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatAPI } from "../services/api";
import Navbar from "../components/Navbar";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Chat() {
  const { userId } = useParams(); // For direct chat with a user
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await chatAPI.getConversations(currentUser.id);
      setConversations(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  const loadMessages = useCallback(async (otherUserId) => {
    try {
      const response = await chatAPI.getConversation(currentUser.id, otherUserId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, [currentUser?.id]);

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

  // Load conversations
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, loadConversations]);

  // Handle direct chat via URL param
  useEffect(() => {
    if (currentUser && userId && conversations.length > 0) {
      const conversation = conversations.find(conv => conv.otherUser._id === userId);
      if (conversation) {
        setSelectedConversation(conversation);
      } else {
        // Create a temporary conversation for direct messaging
        // This would need backend support for starting new conversations
        // For now, just navigate to chat list
        navigate("/chat");
      }
    }
  }, [currentUser, userId, conversations, navigate]);

  // Load conversation messages when selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.otherUser._id);
    }
  }, [selectedConversation, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io for real-time messages
  useEffect(() => {
    if (currentUser) {
      socket.emit("join", currentUser.id);

      socket.on("receiveMessage", (message) => {
        if (selectedConversation && 
            (message.sender._id === selectedConversation.otherUser._id || 
             message.receiver._id === selectedConversation.otherUser._id)) {
          setMessages(prev => [...prev, message]);
        }
        // Update conversations list
        loadConversations();
      });

      return () => {
        socket.off("receiveMessage");
      };
    }
  }, [currentUser, selectedConversation, loadConversations]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !selectedConversation) return;

    setIsSending(true);
    try {
      const response = await chatAPI.sendMessage({
        senderId: currentUser.id,
        receiverId: selectedConversation.otherUser._id,
        text: newMessage.trim()
      });

      // Add message to local state immediately
      setMessages(prev => [...prev, response.data]);
      setNewMessage("");

      // Emit via socket
      socket.emit("sendMessage", response.data);

      // Update conversations
      loadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

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

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden" style={{ height: "calc(100vh - 5rem)" }}>
            <div className="flex h-full">
              {/* Conversations Sidebar */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-4xl mb-2">💬</div>
                      <p>No conversations yet</p>
                      <p className="text-sm">Start chatting with friends!</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation._id}
                        onClick={() => selectConversation(conversation)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation?._id === conversation._id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={conversation.otherUser.profilePicture || "https://via.placeholder.com/40"}
                            alt={conversation.otherUser.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conversation.otherUser.username}
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.text}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="inline-block bg-blue-500 text-white text-xs rounded-full px-2 py-1 mt-1">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                      <img
                        src={selectedConversation.otherUser.profilePicture || "https://via.placeholder.com/40"}
                        alt={selectedConversation.otherUser.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedConversation.otherUser.username}
                        </h3>
                        <p className="text-sm text-gray-500">Active now</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.sender._id === currentUser.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender._id === currentUser.id
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender._id === currentUser.id ? "text-blue-100" : "text-gray-500"
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || isSending}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            !newMessage.trim() || isSending
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          {isSending ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a conversation</h3>
                      <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
