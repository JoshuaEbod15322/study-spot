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
} from "react-icons/fa";

export function Profile() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

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
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

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
          // Already following, just refresh the data
          await Promise.all([fetchFollowers(), fetchFollowing()]);
          return;
        }
        throw error;
      }

      // Refresh both followers and following lists
      await Promise.all([fetchFollowers(), fetchFollowing()]);

      // Show success message
      setSuccessMessage("User followed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error following user:", error);
      setSuccessMessage("Error following user. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      if (!user || user.id === targetUserId) return;

      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;

      // Refresh both followers and following lists
      await Promise.all([fetchFollowers(), fetchFollowing()]);

      // Show success message
      setSuccessMessage("User unfollowed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setSuccessMessage("Error unfollowing user. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 ml-64 p-6 flex items-center justify-center">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 ml-64 p-6 flex items-center justify-center">
        <div className="text-center">User profile not found</div>
      </div>
    );
  }

  const isLibraryStaff = userProfile.role === "library_staff";

  return (
    <div className="min-h-screen bg-gray-50 ml-64 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={userProfile.profile_picture_url} />
                  <AvatarFallback className="text-lg">
                    {userProfile.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
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
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSaveProfile}
                          className="flex items-center"
                        >
                          <FaSave className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditing(false)}
                        >
                          <FaTimes className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-2xl font-bold">
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
                          className="capitalize"
                        >
                          {userProfile.role?.replace("_", " ") || "user"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span>{followers.length} Followers</span>
                        <span>{following.length} Following</span>
                      </div>
                      <p className="text-gray-700 mb-4">
                        {userProfile.bio || "No bio yet."}
                      </p>
                      <div className="text-sm text-gray-600">
                        <p>Email: {userProfile.email}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  className="flex items-center"
                >
                  <FaEdit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role-based Content */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList
            className={`grid w-full ${
              isLibraryStaff ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            <TabsTrigger value="posts">
              {isLibraryStaff ? "My Posts" : "Liked Posts"}
            </TabsTrigger>
            {!isLibraryStaff && (
              <TabsTrigger value="reserved">Reserved</TabsTrigger>
            )}
            <TabsTrigger value="following">Following</TabsTrigger>
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

  const fetchPosts = async () => {
    try {
      let data = [];

      if (userProfile.role === "library_staff") {
        // Library staff sees their own posts
        const { data: postsData, error } = await supabase
          .from("study_places")
          .select("*")
          .eq("created_by", userProfile.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        data = postsData || [];
      } else {
        // Students and teachers see liked posts
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

  if (loading) return <div className="text-center py-8">Loading posts...</div>;

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {userProfile.role === "library_staff"
          ? "You haven't created any study places yet."
          : "You haven't liked any study places yet."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-lg">{post.name}</h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {post.description}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <FaMapMarkerAlt className="w-4 h-4 mr-1" />
              {post.location}
            </div>
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.name}
                className="w-full h-32 object-cover rounded mt-3"
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

  if (loading)
    return <div className="text-center py-8">Loading reservations...</div>;

  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No reservations yet.</div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <Card
          key={reservation.id}
          className="hover:shadow-lg transition-shadow"
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start space-x-3">
                  {reservation.study_place?.image_url && (
                    <img
                      src={reservation.study_place.image_url}
                      alt={reservation.study_place.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {reservation.study_place?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {reservation.study_place?.location}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center">
                        <FaCalendar className="w-3 h-3 mr-1" />
                        {reservation.reservation_date}
                      </span>
                      <span>
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
                className="ml-4"
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

  if (loading)
    return <div className="text-center py-8">Loading following...</div>;

  if (followingUsers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        You're not following anyone yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <Avatar>
            <AvatarImage src={user.profile_picture_url} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{user.name}</h3>
            <Badge variant="outline" className="capitalize text-xs">
              {user.role?.replace("_", " ") || "user"}
            </Badge>
          </div>
        </div>

        {user.bio && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
        )}

        <div className="flex space-x-2">
          <Button size="sm" className="flex-1">
            <FaEnvelope className="w-3 h-3 mr-1" />
            Message
          </Button>
          {!isCurrentUser && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUnfollow(user.id)}
            >
              Unfollow
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// User Hover Card Component (for use throughout the app)
export function UserHoverCard({ user, children, onVisitProfile }) {
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
        // If it's a unique constraint violation, user is already following
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

  const handleVisitProfile = () => {
    if (onVisitProfile && user) {
      onVisitProfile(user);
    }
    setIsOpen(false); // Close the hover card
  };

  const isCurrentUser = currentUser?.id === user?.id;

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        {children || (
          <div
            className="cursor-pointer inline-flex items-center space-x-2 p-2 rounded hover:bg-gray-100"
            onClick={() => setIsOpen(true)} // Make it clickable on mobile
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={userData?.profile_picture_url} />
              <AvatarFallback className="text-xs">
                {userData?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm hover:text-blue-600">
              {userData?.name}
            </span>
          </div>
        )}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
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

            {/* Profile Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{userData?.follower_count || 0} followers</span>
              <span>{userData?.following_count || 0} following</span>
            </div>

            <div className="flex items-center pt-1 space-x-2">
              <Button size="sm" className="flex-1" onClick={handleVisitProfile}>
                <FaUser className="w-3 h-3 mr-1" />
                View Profile
              </Button>
              {!isCurrentUser && (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                  disabled={loading}
                  className="flex-1"
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
