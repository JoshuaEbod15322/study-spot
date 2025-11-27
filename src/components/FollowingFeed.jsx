// src/components/FollowingFeed.jsx
import { StudyPlaceCard } from "./StudyPlaceCard";
import { Button } from "@/components/ui/button";
import { FaUserPlus, FaUsers, FaExclamationTriangle } from "react-icons/fa";

export function FollowingFeed({
  posts,
  loading,
  userProfile,
  reactions,
  onReserve,
  onEditReservation,
  onToggleAvailability,
  onLike,
  onViewComments,
  onDeletePost,
  getUserReservation,
  isStudentOrTeacher,
  onRefresh, // Make sure this prop is received
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          Loading posts from users you follow...
        </p>
      </div>
    );
  }

  // Filter out posts where the creator information is missing or has invalid IDs
  const validPosts = posts.filter(
    (post) =>
      post.creator &&
      post.creator.id &&
      post.creator.id !== "null" &&
      post.creator.id !== "undefined"
  );

  // If there's an error in the data
  if (posts.length > 0 && validPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaExclamationTriangle className="w-12 h-12 text-yellow-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Data Quality Issue
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          There seems to be an issue with the followed users data. Some user IDs
          appear to be invalid.
        </p>
        <Button
          onClick={onRefresh}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
        >
          <FaUserPlus className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
      </div>
    );
  }

  if (validPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaUsers className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No posts from followed users
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          When you follow other users, their study place posts will appear here.
          Start following library staff to see their available study spots!
        </p>
        <Button
          onClick={onRefresh}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
        >
          <FaUserPlus className="w-4 h-4" />
          <span>Discover Users to Follow</span>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Posts from Users You Follow
        </h2>
        <p className="text-gray-600 mt-1">
          Study places shared by users you're following ({validPosts.length}{" "}
          posts)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validPosts.map((place) => {
          const userReservation = getUserReservation(place.id);
          const canReserve =
            isStudentOrTeacher && place.is_available && !userReservation;

          return (
            <StudyPlaceCard
              key={place.id}
              place={place}
              userProfile={userProfile}
              userReservation={userReservation}
              reactions={reactions}
              onReserve={onReserve}
              onEditReservation={onEditReservation}
              onToggleAvailability={onToggleAvailability}
              onLike={onLike}
              onViewComments={onViewComments}
              onDeletePost={onDeletePost}
            />
          );
        })}
      </div>
    </div>
  );
}
