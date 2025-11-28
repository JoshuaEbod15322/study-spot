import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
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
  FaHeart,
} from "react-icons/fa";

// Main profile component with user information and editing capabilities
export function Profile({ onBackToDashboard }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Fetch user profile data from Supabase
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

  // Handle profile picture upload
  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setSuccessMessage("Please select a valid image file");
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
      setSuccessMessage("Profile picture updated!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setSuccessMessage("Error uploading profile picture");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Remove profile picture
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
      setSuccessMessage("Profile picture removed!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error removing profile picture:", error);
      setSuccessMessage("Error removing profile picture");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  // Save profile changes
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
      setSuccessMessage("Profile updated!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSuccessMessage("Error updating profile");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 md:ml-0 p-4 md:p-6 flex items-center justify-center mobile-safe-area">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

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
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative group">
                  <div className="relative">
                    <Avatar className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                      <AvatarImage src={userProfile.profile_picture_url} />
                      <AvatarFallback>
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

                <div className="flex-1 text-center sm:text-left">
                  {editing ? (
                    <div className="space-y-3 w-full">
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
                          className="min-h-[80px]"
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
            <TabsTrigger value="liked">Liked Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <RoleBasedPosts userProfile={userProfile} />
          </TabsContent>

          {!isLibraryStaff && (
            <TabsContent value="reserved">
              <ReservedSpaces userProfile={userProfile} />
            </TabsContent>
          )}

          <TabsContent value="liked">
            <LikedPosts userProfile={userProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Component to display posts based on user role
function RoleBasedPosts({ userProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [userProfile]);

  // Fetch posts based on user role (library staff sees their own posts, others see liked posts)
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
    <div className="responsive-grid">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">{post.name}</h3>
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

// Component to display user reserved spaces
function ReservedSpaces({ userProfile }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, [userProfile]);

  // Fetch user reservations from Supabase
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
                    <h3 className="font-semibold truncate">
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

// Component to display user liked posts
function LikedPosts({ userProfile }) {
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikedPosts();
  }, [userProfile]);

  // Fetch user liked posts from Supabase
  const fetchLikedPosts = async () => {
    try {
      const { data: reactionsData, error } = await supabase
        .from("reactions")
        .select(
          `
          study_place_id,
          study_places (*)
        `
        )
        .eq("user_id", userProfile.id)
        .eq("type", "like")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const posts =
        reactionsData?.map((item) => item.study_places).filter(Boolean) || [];
      setLikedPosts(posts);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-center py-8">Loading liked posts...</div>;

  if (likedPosts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        You haven't liked any posts yet.
      </div>
    );
  }

  return (
    <div className="responsive-grid">
      {likedPosts.map((post) => (
        <Card key={post.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{post.name}</h3>
              <div className="flex items-center text-red-500">
                <FaHeart className="w-4 h-4 mr-1" />
                <span className="text-sm">Liked</span>
              </div>
            </div>
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
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <span className="flex items-center">
                  <FaHeart className="w-3 h-3 mr-1 text-red-500" />
                  Status:{" "}
                  <span
                    className={`ml-1 font-medium ${
                      post.is_available ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {post.is_available ? "Available" : "Unavailable"}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
