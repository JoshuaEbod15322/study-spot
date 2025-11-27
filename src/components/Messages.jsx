// src/components/Messages.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaPaperPlane, FaUser, FaComment } from "react-icons/fa";

export function Messages({ onBackToDashboard }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUsers();
    } else {
      console.log("No user found in Messages component");
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching all users...");

      // Fetch all users except the current user
      const { data, error } = await supabase
        .from("users")
        .select("id, name, profile_picture_url, role, bio")
        .neq("id", user.id)
        .order("name", { ascending: true });

      console.log("Users fetch result:", { data, error });

      if (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users: " + error.message);
        setUsers([]);
        return;
      }

      console.log("Fetched users:", data);
      setUsers(data || []);
    } catch (error) {
      console.error("Unexpected error in fetchUsers:", error);
      setError("An unexpected error occurred");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateConversation = async (otherUserId) => {
    try {
      console.log("Getting or creating conversation with:", otherUserId);

      // First, try to find existing conversation
      const { data: existingConversations, error: findError } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`
        );

      if (findError) {
        console.error("Error finding conversation:", findError);
      }

      let conversationId;

      if (existingConversations && existingConversations.length > 0) {
        // Use existing conversation
        conversationId = existingConversations[0].id;
        setConversation(existingConversations[0]);
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert([
            {
              participant1_id: user.id,
              participant2_id: otherUserId,
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
          return null;
        }

        conversationId = newConversation.id;
        setConversation(newConversation);
      }

      return conversationId;
    } catch (error) {
      console.error("Error in getOrCreateConversation:", error);
      return null;
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      console.log("Fetching messages for conversation:", conversationId);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      console.log("Fetched messages:", data);
      setMessages(data || []);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
    }
  };

  const handleSelectUser = async (selectedUser) => {
    console.log("Selecting user:", selectedUser);
    setSelectedUser(selectedUser);

    const conversationId = await getOrCreateConversation(selectedUser.id);
    if (conversationId) {
      await fetchMessages(conversationId);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user || !conversation) {
      console.log("Cannot send message - missing requirements");
      return;
    }

    setSending(true);
    try {
      console.log("Sending message:", newMessage);

      const { error } = await supabase.from("messages").insert([
        {
          conversation_id: conversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
        },
      ]);

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      console.log("Message sent successfully");
      setNewMessage("");

      // Refresh messages
      await fetchMessages(conversation.id);
    } catch (error) {
      console.error("Unexpected error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <FaUser className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Messages Not Available
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md h-[calc(100vh-3rem)]">
          <div className="flex h-full">
            {/* Users sidebar skeleton */}
            <div className="w-1/3 border-r border-gray-200 p-4">
              <div className="animate-pulse space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat area skeleton */}
            <div className="flex-1 flex flex-col">
              <div className="h-16 border-b border-gray-200"></div>
              <div className="flex-1 p-4 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      i % 2 === 0 ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div className="max-w-xs bg-gray-300 rounded-lg p-3 h-12 w-32"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md h-[calc(100vh-3rem)]">
        <div className="flex h-full">
          {/* Users sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Messages</h2>
              <p className="text-sm text-gray-500 mt-1">
                Chat with other users
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {users.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <FaUser className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="mb-2">No other users found</p>
                  <p className="text-sm">
                    There are no other users to chat with yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {users.map((userItem) => {
                    const isSelected = selectedUser?.id === userItem.id;

                    return (
                      <div
                        key={userItem.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-r-2 border-blue-500"
                            : ""
                        }`}
                        onClick={() => handleSelectUser(userItem)}
                      >
                        <div className="flex items-center space-x-3">
                          {userItem.profile_picture_url ? (
                            <img
                              src={userItem.profile_picture_url}
                              alt={userItem.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <FaUser className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {userItem.name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {userItem.role || "User"}
                            </p>
                            {userItem.bio && (
                              <p className="text-xs text-gray-400 truncate mt-1">
                                {userItem.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <FaComment className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    {selectedUser.profile_picture_url ? (
                      <img
                        src={selectedUser.profile_picture_url}
                        alt={selectedUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <FaUser className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedUser.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedUser.role || "User"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <FaPaperPlane className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">
                        No messages yet
                      </p>
                      <p className="text-sm">
                        Start a conversation with {selectedUser.name}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user.id
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-200 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-end space-x-1 mt-1">
                            <span
                              className={`text-xs ${
                                message.sender_id === user.id
                                  ? "text-blue-200"
                                  : "text-gray-500"
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${selectedUser.name}...`}
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <FaPaperPlane className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                <FaComment className="w-20 h-20 mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">
                  Select a user to start chatting
                </h3>
                <p className="text-sm text-gray-400 text-center max-w-md">
                  Choose someone from the list to begin a conversation. You can
                  message any user in the system.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
