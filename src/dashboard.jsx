// src/dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./lib/supabase";
import { StudyPlaceCard } from "./components/StudyPlaceCard";
import { Sidebar } from "./components/Sidebar";
import { Profile } from "./components/Profile";
import { FollowingFeed } from "./components/FollowingFeed";
import { ReservedView } from "./components/ReservedView";
import { Messages } from "./components/Messages";
import {
  PostModal,
  ReserveModal,
  EditReservationModal,
  CommentsModal,
  ApprovalsModal,
  ReservationsModal,
} from "./components/Modals";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FaComment } from "react-icons/fa";
import educationImg from "/books.svg";
import { format } from "date-fns";

function Dashboard() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [studyPlaces, setStudyPlaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState(null);

  const [currentView, setCurrentView] = useState("dashboard");
  const [followingPosts, setFollowingPosts] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [reservedCount, setReservedCount] = useState(0);

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [editReservationModalOpen, setEditReservationModalOpen] =
    useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
  const [reservationsModalOpen, setReservationsModalOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedComments, setSelectedComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [reactions, setReactions] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const [newPost, setNewPost] = useState({
    name: "",
    description: "",
    location: "",
    image: null,
  });

  const [reservationData, setReservationData] = useState({
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
  });

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initial data load
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchStudyPlaces();
      fetchReservations();
      fetchReservedCount();
    }
  }, [user]);

  // Library staff data
  useEffect(() => {
    if (userProfile?.role === "library_staff") {
      fetchPendingApprovals();
      fetchUserReservations();
    }
  }, [userProfile]);

  // User profile fetch
  const fetchUserProfile = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile");
    }
  };

  // Study places fetch
  const fetchStudyPlaces = async () => {
    try {
      const { data: placesData, error } = await supabase
        .from("study_places")
        .select(
          `
          *,
          creator:users!created_by(name, profile_picture_url, role, bio),
          comments:comments(content, user_id, created_at, users(name))
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudyPlaces(placesData || []);

      const reactionsObj = {};
      if (placesData && user) {
        const userReactionsPromises = placesData.map(async (place) => {
          try {
            const { count: likesCount, error: likesError } = await supabase
              .from("reactions")
              .select("id", { count: "exact", head: true })
              .eq("study_place_id", place.id)
              .eq("type", "like");

            const { data: userLike, error: userLikeError } = await supabase
              .from("reactions")
              .select("id")
              .eq("study_place_id", place.id)
              .eq("user_id", user.id)
              .eq("type", "like")
              .single();

            const { count: commentsCount, error: commentsError } =
              await supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("study_place_id", place.id);

            reactionsObj[place.id] = {
              likes: likesError ? 0 : likesCount || 0,
              comments: commentsError ? 0 : commentsCount || 0,
              userLiked: !userLikeError && !!userLike,
            };
          } catch (err) {
            console.error(
              `Error processing reactions for place ${place.id}:`,
              err
            );
            reactionsObj[place.id] = {
              likes: 0,
              comments: 0,
              userLiked: false,
            };
          }
        });

        await Promise.all(userReactionsPromises);
        setReactions(reactionsObj);
      }
    } catch (error) {
      console.error("Error fetching study places:", error);
      setError("Failed to load study places");
    } finally {
      setLoading(false);
    }
  };

  // Following posts fetch
  const fetchFollowingPosts = async () => {
    if (!user) {
      console.log("No user found");
      return;
    }

    setFollowingLoading(true);
    try {
      const { data: followingData, error: followingError } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followingError) {
        console.error("Error fetching followers:", followingError);
        throw followingError;
      }

      if (!followingData || followingData.length === 0) {
        setFollowingPosts([]);
        setFollowingLoading(false);
        return;
      }

      const followingIds = followingData
        .map((f) => f.following_id)
        .filter((id) => id && id !== "null" && id !== "undefined");

      if (followingIds.length === 0) {
        setFollowingPosts([]);
        setFollowingLoading(false);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from("study_places")
        .select("*")
        .in("created_by", followingIds)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching study places:", postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        setFollowingPosts([]);
        setFollowingLoading(false);
        return;
      }

      const creatorIds = [...new Set(postsData.map((post) => post.created_by))];

      const { data: creatorsData, error: creatorsError } = await supabase
        .from("users")
        .select("id, name, profile_picture_url, role, bio")
        .in("id", creatorIds);

      if (creatorsError) {
        console.error("Error fetching creators:", creatorsError);
        throw creatorsError;
      }

      const enrichedPosts = postsData.map((post) => {
        const creator = creatorsData?.find(
          (user) => user.id === post.created_by
        );
        return {
          ...post,
          creator: creator || {
            id: post.created_by,
            name: "Unknown User",
            profile_picture_url: null,
            role: "user",
            bio: null,
          },
        };
      });

      setFollowingPosts(enrichedPosts);

      const reactionsObj = {};
      const userReactionsPromises = enrichedPosts.map(async (place) => {
        try {
          const { count: likesCount, error: likesError } = await supabase
            .from("reactions")
            .select("id", { count: "exact", head: true })
            .eq("study_place_id", place.id)
            .eq("type", "like");

          const { data: userLike, error: userLikeError } = await supabase
            .from("reactions")
            .select("id")
            .eq("study_place_id", place.id)
            .eq("user_id", user.id)
            .eq("type", "like")
            .maybeSingle();

          const { count: commentsCount, error: commentsError } = await supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("study_place_id", place.id);

          reactionsObj[place.id] = {
            likes: likesError ? 0 : likesCount || 0,
            comments: commentsError ? 0 : commentsCount || 0,
            userLiked: !userLikeError && !!userLike,
          };
        } catch (err) {
          console.error(
            `Error processing reactions for place ${place.id}:`,
            err
          );
          reactionsObj[place.id] = {
            likes: 0,
            comments: 0,
            userLiked: false,
          };
        }
      });

      await Promise.all(userReactionsPromises);
      setReactions((prev) => ({ ...prev, ...reactionsObj }));
    } catch (error) {
      console.error("Detailed error in fetchFollowingPosts:", error);
      setError("Failed to load posts from followed users: " + error.message);
      setFollowingPosts([]);
    } finally {
      setFollowingLoading(false);
    }
  };

  // Reservations fetch
  const fetchReservations = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          *,
          study_place:study_places(name, location),
          user:users(name)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);

      const activeReservations =
        data?.filter((r) => ["pending", "confirmed"].includes(r.status)) || [];
      setReservedCount(activeReservations.length);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  // Reserved count fetch
  const fetchReservedCount = async () => {
    try {
      if (!user) return;
      const { count, error } = await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["pending", "confirmed"]);

      if (error) throw error;
      setReservedCount(count || 0);
    } catch (error) {
      console.error("Error fetching reserved count:", error);
    }
  };

  // Pending approvals fetch
  const fetchPendingApprovals = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          *,
          study_place:study_places(name, location, created_by),
          user:users(name, email, role)
        `
        )
        .eq("study_place.created_by", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      setPendingApprovals(data || []);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
    }
  };

  // User reservations fetch
  const fetchUserReservations = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          *,
          study_place:study_places(name, location, created_by),
          user:users(name, email, role)
        `
        )
        .eq("study_place.created_by", user.id)
        .in("status", ["pending", "confirmed", "cancelled", "completed"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      setUserReservations(data || []);
    } catch (error) {
      console.error("Error fetching user reservations:", error);
    }
  };

  // Comments fetch
  const fetchComments = async (studyPlaceId) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          user:users(name)
        `
        )
        .eq("study_place_id", studyPlaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSelectedComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Navigation handlers
  const handleProfileClick = () => {
    setCurrentView("profile");
  };

  const handleHomeClick = () => {
    setCurrentView("dashboard");
  };

  const handleFollowingClick = () => {
    const isStudentOrTeacher =
      userProfile?.role === "student" || userProfile?.role === "teacher";
    if (isStudentOrTeacher) {
      setCurrentView("following");
      fetchFollowingPosts();
    } else {
      setCurrentView("dashboard");
    }
  };

  const handleReservedClick = () => {
    setCurrentView("reserved");
  };

  const handleMessagesClick = () => {
    setCurrentView("messages");
  };

  // Reservation handlers
  const handleReserveClick = (place) => {
    if (userProfile?.role === "library_staff") return;
    setSelectedPlace(place);
    setReservationData({
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
    });
    setReserveModalOpen(true);
  };

  const handleReserve = async () => {
    try {
      if (!user || !selectedPlace) return;
      const { error } = await supabase.from("reservations").insert([
        {
          user_id: user.id,
          study_place_id: selectedPlace.id,
          reservation_date: format(reservationData.date, "yyyy-MM-dd"),
          start_time: reservationData.startTime,
          end_time: reservationData.endTime,
          status: "pending",
        },
      ]);

      if (error) throw error;

      setReserveModalOpen(false);
      setSuccessMessage(
        "Reservation requested successfully! Waiting for approval."
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchReservations();
      fetchStudyPlaces();
      fetchReservedCount();

      if (userProfile?.role === "library_staff") {
        fetchUserReservations();
      }
    } catch (error) {
      console.error("Error reserving study place:", error);
      setSuccessMessage("Error making reservation. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setReservationData({
      date: new Date(reservation.reservation_date),
      startTime: reservation.start_time,
      endTime: reservation.end_time,
    });
    setEditReservationModalOpen(true);
  };

  const handleUpdateReservation = async () => {
    try {
      if (!selectedReservation) return;
      const { error } = await supabase
        .from("reservations")
        .update({
          reservation_date: format(reservationData.date, "yyyy-MM-dd"),
          start_time: reservationData.startTime,
          end_time: reservationData.endTime,
          status: "pending",
        })
        .eq("id", selectedReservation.id);

      if (error) throw error;

      setEditReservationModalOpen(false);
      setSuccessMessage(
        "Reservation updated successfully! Waiting for re-approval."
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchReservations();
      fetchReservedCount();

      if (userProfile?.role === "library_staff") {
        fetchUserReservations();
      }
    } catch (error) {
      console.error("Error updating reservation:", error);
      setSuccessMessage("Error updating reservation. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Approval handlers
  const handleApproveReservation = async (reservationId) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "confirmed",
        })
        .eq("id", reservationId);

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      setSuccessMessage("Reservation accepted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setPendingApprovals((prev) =>
        prev.filter((approval) => approval.id !== reservationId)
      );
      fetchPendingApprovals();
      fetchUserReservations();
      fetchReservedCount();
    } catch (error) {
      console.error("Error accepting reservation:", error);
      setSuccessMessage("Error accepting reservation. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleRejectReservation = async (reservationId) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;

      setSuccessMessage("Reservation rejected successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setPendingApprovals((prev) =>
        prev.filter((approval) => approval.id !== reservationId)
      );
      fetchUserReservations();
      fetchReservedCount();

      setTimeout(() => {
        fetchPendingApprovals();
      }, 100);
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      setSuccessMessage("Error rejecting reservation. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    try {
      const { error, count } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservationId);

      if (error) {
        console.error("Supabase deletion error:", error);
        throw error;
      }

      setSuccessMessage("Reservation deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setPendingApprovals((prev) =>
        prev.filter((approval) => approval.id !== reservationId)
      );
      setUserReservations((prev) =>
        prev.filter((reservation) => reservation.id !== reservationId)
      );
      setReservations((prev) =>
        prev.filter((reservation) => reservation.id !== reservationId)
      );
      fetchReservedCount();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      setSuccessMessage("Error deleting reservation. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Post management handlers
  const handleToggleAvailability = async (placeId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("study_places")
        .update({ is_available: !currentStatus })
        .eq("id", placeId);

      if (error) throw error;

      setSuccessMessage(
        `Study place ${
          !currentStatus ? "set as available" : "set as unavailable"
        }!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchStudyPlaces();
      if (currentView === "following") {
        fetchFollowingPosts();
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  const handleDeletePost = async (placeId) => {
    try {
      await supabase.from("comments").delete().eq("study_place_id", placeId);
      await supabase.from("reactions").delete().eq("study_place_id", placeId);
      await supabase
        .from("reservations")
        .delete()
        .eq("study_place_id", placeId);

      const { error } = await supabase
        .from("study_places")
        .delete()
        .eq("id", placeId);

      if (error) throw error;

      setSuccessMessage("Post deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchStudyPlaces();
      fetchReservations();
      fetchUserReservations();
      fetchReservedCount();
      if (currentView === "following") {
        fetchFollowingPosts();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setSuccessMessage("Error deleting post. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Comment handlers
  const handleAddComment = async (placeId, commentText) => {
    try {
      if (!user) return;
      const { error } = await supabase.from("comments").insert([
        {
          user_id: user.id,
          study_place_id: placeId,
          content: commentText,
        },
      ]);

      if (error) throw error;

      setSuccessMessage("Comment added successfully!");
      setTimeout(() => setSuccessMessage(""), 2000);
      fetchStudyPlaces();
      if (currentView === "following") {
        fetchFollowingPosts();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleViewComments = (place) => {
    setSelectedPlace(place);
    fetchComments(place.id);
    setCommentsModalOpen(true);
  };

  // Like handler
  const handleLike = async (placeId) => {
    try {
      if (!user) return;
      const { data: existingLike, error: checkError } = await supabase
        .from("reactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("study_place_id", placeId)
        .eq("type", "like")
        .single();

      if (existingLike && !checkError) {
        await supabase.from("reactions").delete().eq("id", existingLike.id);

        setReactions((prev) => ({
          ...prev,
          [placeId]: {
            ...prev[placeId],
            likes: Math.max(0, (prev[placeId]?.likes || 0) - 1),
            userLiked: false,
          },
        }));
      } else {
        await supabase.from("reactions").insert([
          {
            user_id: user.id,
            study_place_id: placeId,
            type: "like",
          },
        ]);

        setReactions((prev) => ({
          ...prev,
          [placeId]: {
            ...prev[placeId],
            likes: (prev[placeId]?.likes || 0) + 1,
            userLiked: true,
          },
        }));
      }

      fetchStudyPlaces();
      if (currentView === "following") {
        fetchFollowingPosts();
      }
    } catch (error) {
      console.error("Error handling like:", error);
    }
  };

  // Post creation handlers
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!userProfile || userProfile.role !== "library_staff" || !user) return;

    setUploading(true);
    try {
      let imageUrl = null;

      if (newPost.image) {
        const fileExt = newPost.image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("study-place-images")
          .upload(filePath, newPost.image);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("study-place-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("study_places").insert([
        {
          name: newPost.name,
          description: newPost.description,
          location: newPost.location,
          image_url: imageUrl,
          is_available: true,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      setPostModalOpen(false);
      setNewPost({ name: "", description: "", location: "", image: null });
      setSuccessMessage("Study place created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchStudyPlaces();
      if (currentView === "following") {
        fetchFollowingPosts();
      }
    } catch (error) {
      console.error("Error creating study place:", error);
      setSuccessMessage("Error creating study place. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost((prev) => ({ ...prev, image: file }));
    }
  };

  const handlePostChange = (field, value) => {
    setNewPost((prev) => ({ ...prev, [field]: value }));
  };

  const handleReservationChange = (field, value) => {
    setReservationData((prev) => ({ ...prev, [field]: value }));
  };

  // Auth handler
  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSigningOut(false);
    }
  };

  // Utility functions
  const getUserReservation = (placeId) => {
    return reservations.find(
      (r) =>
        r.study_place_id === placeId &&
        (r.status === "confirmed" || r.status === "pending") &&
        r.user_id === user?.id
    );
  };

  const isStudentOrTeacher =
    userProfile?.role === "student" || userProfile?.role === "teacher";

  // Skeleton component
  const StudyPlaceSkeleton = () => (
    <div className="responsive-card">
      <div className="p-4 flex items-center space-x-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="responsive-image rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-4 h-4" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
          {successMessage}
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          userProfile={userProfile}
          pendingApprovals={pendingApprovals}
          onPost={() => setPostModalOpen(true)}
          onApprovals={() => setApprovalsModalOpen(true)}
          onReservations={() => {
            fetchUserReservations();
            setReservationsModalOpen(true);
          }}
          onSignOut={handleSignOut}
          onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
          onProfileClick={handleProfileClick}
          onHomeClick={handleHomeClick}
          onFollowingClick={handleFollowingClick}
          onReservedClick={handleReservedClick}
          currentView={currentView}
          settingsOpen={settingsOpen}
          signingOut={signingOut}
          reservedCount={reservedCount}
          isMobile={false}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col ${
          !isMobile ? "md:ml-64" : ""
        } mobile-safe-area`}
      >
        <main className="flex-1 p-4 sm:p-6 relative">
          {currentView === "profile" ? (
            <Profile onBackToDashboard={handleHomeClick} />
          ) : currentView === "following" ? (
            <FollowingFeed
              posts={followingPosts}
              loading={followingLoading}
              userProfile={userProfile}
              reactions={reactions}
              onReserve={handleReserveClick}
              onEditReservation={handleEditReservation}
              onToggleAvailability={handleToggleAvailability}
              onLike={handleLike}
              onViewComments={handleViewComments}
              onDeletePost={handleDeletePost}
              getUserReservation={getUserReservation}
              isStudentOrTeacher={isStudentOrTeacher}
              onRefresh={fetchFollowingPosts}
            />
          ) : currentView === "reserved" ? (
            <ReservedView
              user={user}
              onBackToDashboard={handleHomeClick}
              userProfile={userProfile}
            />
          ) : currentView === "messages" ? (
            <Messages onBackToDashboard={handleHomeClick} />
          ) : (
            <>
              {loading ? (
                <div className="responsive-grid">
                  {[...Array(6)].map((_, index) => (
                    <StudyPlaceSkeleton key={index} />
                  ))}
                </div>
              ) : (
                <div className="responsive-grid">
                  {studyPlaces.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <img
                        src={educationImg}
                        alt="No posts available"
                        className="max-w-xs mx-auto mb-4 w-full h-auto"
                        loading="lazy"
                      />
                      <p className="text-gray-500 text-lg mb-2">
                        No posts yet.
                      </p>
                      {userProfile?.role === "library_staff" && (
                        <p className="text-blue-600 font-medium">
                          Be the first to add a study place!
                        </p>
                      )}
                    </div>
                  ) : (
                    studyPlaces.map((place) => {
                      const userReservation = getUserReservation(place.id);
                      const canReserve =
                        isStudentOrTeacher &&
                        place.is_available &&
                        !userReservation;

                      return (
                        <StudyPlaceCard
                          key={place.id}
                          place={place}
                          userProfile={userProfile}
                          userReservation={userReservation}
                          reactions={reactions}
                          onReserve={handleReserveClick}
                          onEditReservation={handleEditReservation}
                          onToggleAvailability={handleToggleAvailability}
                          onLike={handleLike}
                          onViewComments={handleViewComments}
                          onDeletePost={handleDeletePost}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}

          {/* Floating Action Button */}
          <Button
            onClick={handleMessagesClick}
            className={`fixed ${
              isMobile ? "bottom-20" : "bottom-6"
            } right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors group touch-target z-40`}
            aria-label="Open messages"
          >
            <FaComment className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </Button>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Sidebar
          userProfile={userProfile}
          pendingApprovals={pendingApprovals}
          onPost={() => setPostModalOpen(true)}
          onApprovals={() => setApprovalsModalOpen(true)}
          onReservations={() => {
            fetchUserReservations();
            setReservationsModalOpen(true);
          }}
          onSignOut={handleSignOut}
          onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
          onProfileClick={handleProfileClick}
          onHomeClick={handleHomeClick}
          onFollowingClick={handleFollowingClick}
          onReservedClick={handleReservedClick}
          currentView={currentView}
          settingsOpen={settingsOpen}
          signingOut={signingOut}
          reservedCount={reservedCount}
          isMobile={true}
        />
      )}

      {/* Modals */}
      <PostModal
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
        newPost={newPost}
        onPostChange={handlePostChange}
        onImageChange={handleImageChange}
        onSubmit={handleCreatePost}
        uploading={uploading}
      />

      <ReserveModal
        open={reserveModalOpen}
        onOpenChange={setReserveModalOpen}
        selectedPlace={selectedPlace}
        reservationData={reservationData}
        onReservationChange={handleReservationChange}
        onReserve={handleReserve}
      />

      <EditReservationModal
        open={editReservationModalOpen}
        onOpenChange={setEditReservationModalOpen}
        selectedReservation={selectedReservation}
        reservationData={reservationData}
        onReservationChange={handleReservationChange}
        onUpdate={handleUpdateReservation}
      />

      <CommentsModal
        open={commentsModalOpen}
        onOpenChange={setCommentsModalOpen}
        selectedPlace={selectedPlace}
        comments={selectedComments}
        newComment={newComment}
        onCommentChange={(e) => setNewComment(e.target.value)}
        onAddComment={() => {
          if (selectedPlace) {
            handleAddComment(selectedPlace.id, newComment);
            setNewComment("");
          }
        }}
      />

      <ApprovalsModal
        open={approvalsModalOpen}
        onOpenChange={setApprovalsModalOpen}
        pendingApprovals={pendingApprovals}
        onApprove={handleApproveReservation}
        onReject={handleRejectReservation}
        onDelete={handleDeleteReservation}
      />

      <ReservationsModal
        open={reservationsModalOpen}
        onOpenChange={setReservationsModalOpen}
        userReservations={userReservations}
        onDeleteReservation={handleDeleteReservation}
        userProfile={userProfile}
      />
    </div>
  );
}

export default Dashboard;
