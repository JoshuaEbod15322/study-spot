// src/components/Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaMapMarkerAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaGraduationCap,
  FaBook,
  FaBuilding,
  FaArrowLeft,
  FaCamera,
  FaTrash,
} from "react-icons/fa";

export function Profile({ onBackToDashboard }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchFollowers();
      fetchFollowing();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
      setEditForm({
        name: data.name,
        bio: data.bio || "",
        email: data.email,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Profile picture upload handler
  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setSuccessMessage("Please select a valid image file (JPEG, PNG, etc.)");
        setTimeout(() => setSuccessMessage(""), 3000);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setSuccessMessage("Image size should be less than 5MB");
        setTimeout(() => setSuccessMessage(""), 3000);
        return;
      }

      if (userProfile?.profile_picture_url) {
        const oldFileName = userProfile.profile_picture_url.split("/").pop();
        if (oldFileName && !oldFileName.includes("default")) {
          try {
            await supabase.storage
              .from("profile-pictures")
              .remove([oldFileName]);
          } catch (error) {
            console.error("Error deleting old profile picture:", error);
          }
        }
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_picture_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      setUserProfile((prev) => ({ ...prev, profile_picture_url: publicUrl }));
      setSuccessMessage("Profile picture updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setSuccessMessage("Error uploading profile picture. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Profile picture removal handler
  const handleRemoveProfilePicture = async () => {
    try {
      setUploading(true);

      if (!userProfile?.profile_picture_url) return;

      const fileName = userProfile.profile_picture_url.split("/").pop();
      if (fileName && !fileName.includes("default")) {
        try {
          await supabase.storage.from("profile-pictures").remove([fileName]);
        } catch (error) {
          console.error("Error deleting profile picture from storage:", error);
        }
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_picture_url: null })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setUserProfile((prev) => ({ ...prev, profile_picture_url: null }));
      setSuccessMessage("Profile picture removed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error removing profile picture:", error);
      setSuccessMessage("Error removing profile picture. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const { data, error } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("following_id", user.id);

      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);

      if (error) throw error;
      setFollowing(data || []);
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  // Profile update handler
  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editForm.name,
          bio: editForm.bio,
        })
        .eq("id", user.id);

      if (error) throw error;

      setUserProfile((prev) => ({ ...prev, ...editForm }));
      setEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSuccessMessage("Error updating profile. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Follow user handler
  const handleFollow = async (targetUserId) => {
    try {
      if (!user || user.id === targetUserId) return;

      const { error } = await supabase.from("followers").insert([
        {
          follower_id: user.id,
          following_id: targetUserId,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          await Promise.all([fetchFollowers(), fetchFollowing()]);
          return;
        }
        throw error;
      }

      await Promise.all([fetchFollowers(), fetchFollowing()]);
      setSuccessMessage("User followed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error following user:", error);
      setSuccessMessage("Error following user. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Unfollow user handler
  const handleUnfollow = async (targetUserId) => {
    try {
      if (!user || user.id === targetUserId) return;

      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;

      await Promise.all([fetchFollowers(), fetchFollowing()]);
      setSuccessMessage("User unfollowed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setSuccessMessage("Error unfollowing user. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 md:ml-0 p-4 md:p-6 flex items-center justify-center mobile-safe-area">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  // Error state
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 md:ml-0 p-4 md:p-6 flex items-center justify-center mobile-safe-area">
        <div className="text-center">User profile not found</div>
      </div>
    );
  }

  const isLibraryStaff = userProfile.role === "library_staff";

  return (
    <div className="min-h-screen bg-gray-50 md:ml-0 p-4 md:p-6 mobile-safe-area">
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
          {successMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Profile Header Section */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Profile Picture Section */}
                <div className="relative group">
                  <div className="relative">
                    <Avatar className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                      <AvatarImage src={userProfile.profile_picture_url} />
                      <AvatarFallback className="text-lg">
                        {userProfile.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <label
                        htmlFor="profile-picture-upload"
                        className="cursor-pointer"
                      >
                        <FaCamera className="w-6 h-6 text-white" />
                      </label>
                      <input
                        id="profile-picture-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </div>

                    {userProfile.profile_picture_url && (
                      <button
                        onClick={handleRemoveProfilePicture}
                        disabled={uploading}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove profile picture"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="text-white text-sm">Uploading...</div>
                    </div>
                  )}
                </div>

                {/* Profile Information Section */}
                <div className="flex-1 text-center sm:text-left">
                  {editing ? (
                    <div className="space-y-3 w-full">
                      <div>
                        <Label htmlFor="name" className="text-sm md:text-base">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio" className="text-sm md:text-base">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                          placeholder="Tell us about yourself..."
                          className="w-full min-h-[80px]"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          onClick={handleSaveProfile}
                          className="flex items-center justify-center flex-1"
                        >
                          <FaSave className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditing(false)}
                          className="flex items-center justify-center flex-1"
                        >
                          <FaTimes className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <h1 className="text-xl md:text-2xl font-bold">
                          {userProfile.name}
                        </h1>
                        <Badge
                          variant={
                            userProfile.role === "library_staff"
                              ? "default"
                              : userProfile.role === "teacher"
                              ? "secondary"
                              : "outline"
                          }
                          className="capitalize w-fit mx-auto sm:mx-0"
                        >
                          {userProfile.role?.replace("_", " ") || "user"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-600 mb-3">
                        <span>{followers.length} Followers</span>
                        <span>{following.length} Following</span>
                      </div>
                      <p className="text-gray-700 mb-4 text-center sm:text-left">
                        {userProfile.bio || "No bio yet."}
                      </p>
                      <div className="text-sm text-gray-600 text-center sm:text-left">
                        <p>Email: {userProfile.email}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Edit Profile Button */}
              {!editing && (
                <div className="flex justify-center md:justify-start">
                  <Button
                    onClick={() => setEditing(true)}
                    className="flex items-center w-full sm:w-auto justify-center"
                  >
                    <FaEdit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content Section */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList
            className={`grid w-full ${
              isLibraryStaff ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            <TabsTrigger value="posts" className="text-xs md:text-sm">
              {isLibraryStaff ? "My Posts" : "Liked Posts"}
            </TabsTrigger>
            {!isLibraryStaff && (
              <TabsTrigger value="reserved" className="text-xs md:text-sm">
                Reserved
              </TabsTrigger>
            )}
            <TabsTrigger value="following" className="text-xs md:text-sm">
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <RoleBasedPosts userProfile={userProfile} />
          </TabsContent>

          {!isLibraryStaff && (
            <TabsContent value="reserved">
              <ReservedSpaces userProfile={userProfile} />
            </TabsContent>
          )}

          <TabsContent value="following">
            <FollowingList
              following={following}
              onUnfollow={handleUnfollow}
              currentUserId={user.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Role-based Posts Component
function RoleBasedPosts({ userProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [userProfile]);

  // Posts data fetch
  const fetchPosts = async () => {
    try {
      let data = [];

      if (userProfile.role === "library_staff") {
        const { data: postsData, error } = await supabase
          .from("study_places")
          .select("*")
          .eq("created_by", userProfile.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        data = postsData || [];
      } else {
        const { data: reactionsData, error: reactionsError } = await supabase
          .from("reactions")
          .select(
            `
            study_place_id,
            study_places (*)
          `
          )
          .eq("user_id", userProfile.id)
          .eq("type", "like");

        if (reactionsError) throw reactionsError;
        data = reactionsData?.map((item) => item.study_places) || [];
      }

      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) return <div className="text-center py-8">Loading posts...</div>;

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {userProfile.role === "library_staff"
          ? "You haven't created any study places yet."
          : "You haven't liked any study places yet."}
      </div>
    );
  }

  // Posts grid display
  return (
    <div className="responsive-grid">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-base md:text-lg">
              {post.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {post.description}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <FaMapMarkerAlt className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{post.location}</span>
            </div>
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.name}
                className="w-full h-32 object-cover rounded mt-3"
                loading="lazy"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Reserved Spaces Component
function ReservedSpaces({ userProfile }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, [userProfile]);

  // Reservations data fetch
  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          *,
          study_place:study_places(name, location, image_url)
        `
        )
        .eq("user_id", userProfile.id)
        .order("reservation_date", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading)
    return <div className="text-center py-8">Loading reservations...</div>;

  // Empty state
  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No reservations yet.</div>
    );
  }

  // Reservations list display
  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <Card
          key={reservation.id}
          className="hover:shadow-lg transition-shadow"
        >
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
              <div className="flex-1">
                <div className="flex items-start space-x-3">
                  {reservation.study_place?.image_url && (
                    <img
                      src={reservation.study_place.image_url}
                      alt={reservation.study_place.name}
                      className="w-16 h-16 object-cover rounded flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base md:text-lg truncate">
                      {reservation.study_place?.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {reservation.study_place?.location}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 mt-2 space-y-1 sm:space-y-0">
                      <span className="flex items-center">
                        <FaCalendar className="w-3 h-3 mr-1 flex-shrink-0" />
                        {reservation.reservation_date}
                      </span>
                      <span className="flex items-center">
                        {reservation.start_time} - {reservation.end_time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  reservation.status === "confirmed"
                    ? "default"
                    : reservation.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
                className="sm:ml-4 w-fit mx-auto sm:mx-0"
              >
                {reservation.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Following List Component
function FollowingList({ following, onUnfollow, currentUserId }) {
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowingUsers();
  }, [following]);

  // Following users data fetch
  const fetchFollowingUsers = async () => {
    try {
      if (following.length === 0) {
        setFollowingUsers([]);
        setLoading(false);
        return;
      }

      const userIds = following.map((f) => f.following_id);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);

      if (error) throw error;
      setFollowingUsers(data || []);
    } catch (error) {
      console.error("Error fetching following users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading)
    return <div className="text-center py-8">Loading following...</div>;

  // Empty state
  if (followingUsers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        You're not following anyone yet.
      </div>
    );
  }

  // Following users grid display
  return (
    <div className="responsive-grid">
      {followingUsers.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onUnfollow={onUnfollow}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

// User Card Component for Following List
function UserCard({ user, onUnfollow, currentUserId }) {
  const isCurrentUser = user.id === currentUserId;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="flex-shrink-0">
            <AvatarImage src={user.profile_picture_url} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm md:text-base truncate">
              {user.name}
            </h3>
            <Badge variant="outline" className="capitalize text-xs">
              {user.role?.replace("_", " ") || "user"}
            </Badge>
          </div>
        </div>

        {user.bio && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
        )}

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button size="sm" className="flex-1 justify-center">
            <FaEnvelope className="w-3 h-3 mr-1" />
            Message
          </Button>
          {!isCurrentUser && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUnfollow(user.id)}
              className="flex-1 justify-center"
            >
              Unfollow
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// User Hover Card Component
export function UserHoverCard({ user, children, onMessageUser }) {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(user);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentUser && user) {
      checkIfFollowing();
    }
  }, [user, currentUser]);

  // Follow status check
  const checkIfFollowing = async () => {
    if (!currentUser || !user) return;

    try {
      const { data, error } = await supabase
        .from("followers")
        .select("*")
        .eq("follower_id", currentUser.id)
        .eq("following_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking follow status:", error);
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  // Follow user handler
  const handleFollow = async () => {
    if (!currentUser || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("followers").insert([
        {
          follower_id: currentUser.id,
          following_id: user.id,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          setIsFollowing(true);
        } else {
          throw error;
        }
      } else {
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setLoading(false);
    }
  };

  // Unfollow user handler
  const handleUnfollow = async () => {
    if (!currentUser || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", user.id);

      if (error) throw error;

      setIsFollowing(false);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    } finally {
      setLoading(false);
    }
  };

  // Message user handler
  const handleMessageUser = () => {
    if (onMessageUser && user) {
      onMessageUser(user);
    }
    setIsOpen(false);
  };

  const isCurrentUser = currentUser?.id === user?.id;

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        {children || (
          <div
            className="cursor-pointer inline-flex items-center space-x-2 p-2 rounded hover:bg-gray-100 touch-target"
            onClick={() => setIsOpen(true)}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={userData?.profile_picture_url} />
              <AvatarFallback className="text-xs">
                {userData?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm hover:text-blue-600 truncate">
              {userData?.name}
            </span>
          </div>
        )}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 max-w-[90vw]" align="start">
        <div className="flex justify-between space-x-4">
          <Avatar className="w-16 h-16 flex-shrink-0">
            <AvatarImage src={userData?.profile_picture_url} />
            <AvatarFallback className="text-lg">
              {userData?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold truncate">
                {userData?.name}
              </h4>
              <Badge
                variant="outline"
                className="capitalize text-xs flex-shrink-0"
              >
                {userData?.role?.replace("_", " ") || "user"}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {userData?.bio || "No bio yet."}
            </p>

            {/* Profile Stats Section */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{userData?.follower_count || 0} followers</span>
              <span>{userData?.following_count || 0} following</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center pt-1 space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                size="sm"
                className="flex-1 w-full sm:w-auto"
                onClick={handleMessageUser}
              >
                <FaEnvelope className="w-3 h-3 mr-1" />
                Message
              </Button>
              {!isCurrentUser && (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                  disabled={loading}
                  className="flex-1 w-full sm:w-auto"
                >
                  {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
