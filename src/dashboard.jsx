import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./lib/supabase";
import { StudyPlaceCard } from "./components/StudyPlaceCard";
import { Sidebar } from "./components/Sidebar";
import { Profile } from "./components/Profile";
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
import { Button } from "@/components/ui/button";
import { FaComment, FaSpinner } from "react-icons/fa";
import educationImg from "/books.svg";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import "./responsive.css";

function Dashboard() {
  // Authentication and user state
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

  // View and navigation state
  const [currentView, setCurrentView] = useState("dashboard");
  const [reservedCount, setReservedCount] = useState(0);

  // Modal states
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [editReservationModalOpen, setEditReservationModalOpen] =
    useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
  const [reservationsModalOpen, setReservationsModalOpen] = useState(false);

  // UI and interaction state
  const [uploading, setUploading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedComments, setSelectedComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [reactions, setReactions] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Form data state
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

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Navigation
  const navigate = useNavigate();

  // Effect for responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Effect for initial data loading
  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  // Effect for library staff specific data
  useEffect(() => {
    if (userProfile?.role === "library_staff") {
      fetchPendingApprovals();
      fetchUserReservations();
    }
  }, [userProfile]);

  // Optimized data fetching functions
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchStudyPlaces(),
        fetchReservations(),
        fetchReservedCount(),
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("Failed to load application data");
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      throw error;
    }
  };

  const fetchStudyPlaces = async () => {
    try {
      const { data: placesData, error } = await supabase
        .from("study_places")
        .select(
          `
          *,
          creator:users!created_by(name, profile_picture_url, role, bio)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudyPlaces(placesData || []);

      // Fetch reactions in parallel for better performance
      if (placesData && user) {
        const reactionsPromises = placesData.map(async (place) => {
          try {
            const [likesResult, userLikeResult, commentsResult] =
              await Promise.all([
                supabase
                  .from("reactions")
                  .select("id", { count: "exact", head: true })
                  .eq("study_place_id", place.id)
                  .eq("type", "like"),
                supabase
                  .from("reactions")
                  .select("id")
                  .eq("study_place_id", place.id)
                  .eq("user_id", user.id)
                  .eq("type", "like")
                  .single(),
                supabase
                  .from("comments")
                  .select("id", { count: "exact", head: true })
                  .eq("study_place_id", place.id),
              ]);

            return {
              [place.id]: {
                likes: likesResult.error ? 0 : likesResult.count || 0,
                comments: commentsResult.error ? 0 : commentsResult.count || 0,
                userLiked: !userLikeResult.error && !!userLikeResult.data,
              },
            };
          } catch (err) {
            console.error(
              `Error processing reactions for place ${place.id}:`,
              err
            );
            return {
              [place.id]: {
                likes: 0,
                comments: 0,
                userLiked: false,
              },
            };
          }
        });

        const reactionsArray = await Promise.all(reactionsPromises);
        const reactionsObj = Object.assign({}, ...reactionsArray);
        setReactions(reactionsObj);
      }
    } catch (error) {
      console.error("Error fetching study places:", error);
      throw error;
    }
  };

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

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
    }
  };

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

      if (error) throw error;
      setUserReservations(data || []);
    } catch (error) {
      console.error("Error fetching user reservations:", error);
    }
  };

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
  const handleProfileClick = useCallback(() => {
    setCurrentView("profile");
  }, []);

  const handleHomeClick = useCallback(() => {
    setCurrentView("dashboard");
  }, []);

  const handleReservedClick = useCallback(() => {
    setCurrentView("reserved");
  }, []);

  const handleMessagesClick = useCallback(() => {
    setCurrentView("messages");
  }, []);

  // Reservation handlers
  const handleReserveClick = useCallback(
    (place) => {
      if (userProfile?.role === "library_staff") return;
      setSelectedPlace(place);
      setReservationData({
        date: new Date(),
        startTime: "09:00",
        endTime: "10:00",
      });
      setReserveModalOpen(true);
    },
    [userProfile]
  );

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

      // Update data in parallel
      await Promise.all([
        fetchReservations(),
        fetchStudyPlaces(),
        fetchReservedCount(),
      ]);

      if (userProfile?.role === "library_staff") {
        fetchUserReservations();
      }
    } catch (error) {
      console.error("Error reserving study place:", error);
      setSuccessMessage("Error making reservation. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleEditReservation = useCallback((reservation) => {
    setSelectedReservation(reservation);
    setReservationData({
      date: new Date(reservation.reservation_date),
      startTime: reservation.start_time,
      endTime: reservation.end_time,
    });
    setEditReservationModalOpen(true);
  }, []);

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

      await Promise.all([fetchReservations(), fetchReservedCount()]);

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

      if (error) throw error;

      setSuccessMessage("Reservation accepted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setPendingApprovals((prev) =>
        prev.filter((approval) => approval.id !== reservationId)
      );

      await Promise.all([
        fetchPendingApprovals(),
        fetchUserReservations(),
        fetchReservedCount(),
      ]);
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

      await Promise.all([fetchUserReservations(), fetchReservedCount()]);

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
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservationId);

      if (error) throw error;

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

  // Study place management handlers
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
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  const handleDeletePost = async (placeId) => {
    try {
      await Promise.all([
        supabase.from("comments").delete().eq("study_place_id", placeId),
        supabase.from("reactions").delete().eq("study_place_id", placeId),
        supabase.from("reservations").delete().eq("study_place_id", placeId),
      ]);

      const { error } = await supabase
        .from("study_places")
        .delete()
        .eq("id", placeId);

      if (error) throw error;

      setSuccessMessage("Post deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      await Promise.all([
        fetchStudyPlaces(),
        fetchReservations(),
        fetchReservedCount(),
      ]);

      if (userProfile?.role === "library_staff") {
        fetchUserReservations();
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
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleViewComments = useCallback((place) => {
    setSelectedPlace(place);
    fetchComments(place.id);
    setCommentsModalOpen(true);
  }, []);

  // Like handler
  const handleLike = useCallback(
    async (placeId) => {
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
      } catch (error) {
        console.error("Error handling like:", error);
      }
    },
    [user]
  );

  // Post creation handler
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
    } catch (error) {
      console.error("Error creating study place:", error);
      setSuccessMessage("Error creating study place. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  // Form change handlers
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost((prev) => ({ ...prev, image: file }));
    }
  }, []);

  const handlePostChange = useCallback((field, value) => {
    setNewPost((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleReservationChange = useCallback((field, value) => {
    setReservationData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Authentication handler
  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await signOut();

      if (error) {
        console.warn("Sign out completed with warning:", error.message);
      }

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  // Utility functions
  const getUserReservation = useCallback(
    (placeId) => {
      return reservations.find(
        (r) =>
          r.study_place_id === placeId &&
          (r.status === "confirmed" || r.status === "pending") &&
          r.user_id === user?.id
      );
    },
    [reservations, user]
  );

  const isStudentOrTeacher = useMemo(
    () => userProfile?.role === "student" || userProfile?.role === "teacher",
    [userProfile]
  );

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <FaSpinner className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading study places...</p>
      </div>
    </div>
  );

  // Error boundary
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

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Success message toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
          {successMessage}
        </div>
      )}

      {/* Desktop sidebar */}
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
          onReservedClick={handleReservedClick}
          currentView={currentView}
          settingsOpen={settingsOpen}
          signingOut={signingOut}
          reservedCount={reservedCount}
          isMobile={false}
        />
      )}

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col ${
          !isMobile ? "md:ml-64" : ""
        } mobile-safe-area`}
      >
        <main className="flex-1 p-4 sm:p-6 relative">
          {/* Conditional rendering based on current view */}
          {currentView === "profile" ? (
            <Profile onBackToDashboard={handleHomeClick} />
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
              {/* Loading state */}
              {loading ? (
                <LoadingSpinner />
              ) : (
                /* Study places grid */
                <div className="responsive-grid">
                  {studyPlaces.length === 0 ? (
                    /* Empty state */
                    <div className="col-span-full text-center py-12">
                      <img
                        src={educationImg}
                        alt="No posts available"
                        className="max-w-xs mx-auto mb-4 w-full h-auto"
                        loading="lazy"
                        width="320"
                        height="240"
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
                    /* Study place cards */
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

          {/* Floating messages button */}
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

      {/* Mobile sidebar */}
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
          onReservedClick={handleReservedClick}
          currentView={currentView}
          settingsOpen={settingsOpen}
          signingOut={signingOut}
          reservedCount={reservedCount}
          isMobile={true}
        />
      )}

      {/* Modal components */}
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
