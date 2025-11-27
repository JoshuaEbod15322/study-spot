// src/components/StudyPlaceCard.jsx
import {
  FaUser,
  FaMapMarkerAlt,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaHeart,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { UserHoverCard } from "./Profile";

export function StudyPlaceCard({
  place,
  userProfile,
  userReservation,
  reactions,
  onReserve,
  onEditReservation,
  onToggleAvailability,
  onLike,
  onViewComments,
  onDeletePost,
}) {
  const isStudentOrTeacher =
    userProfile?.role === "student" || userProfile?.role === "teacher";
  const canReserve =
    isStudentOrTeacher && place.is_available && !userReservation;
  const placeReactions = reactions[place.id] || {
    likes: 0,
    comments: 0,
    userLiked: false,
  };
  const isLibraryStaff = userProfile?.role === "library_staff";
  const isOwner = isLibraryStaff && place.created_by === userProfile?.id;

  // Get the creator information - FIXED
  const creator = place.creator || place.users;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* User Info with Hover Card - FIXED */}
      <div className="p-4 flex items-center space-x-3">
        {creator && (
          <UserHoverCard user={creator}>
            <div className="flex items-center space-x-3 cursor-pointer">
              {creator.profile_picture_url ? (
                <img
                  src={creator.profile_picture_url}
                  alt={creator.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <FaUser className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hover:text-blue-600">
                {creator.name || "Unknown User"}
              </span>
            </div>
          </UserHoverCard>
        )}
      </div>

      {/* Rest of the component remains the same */}
      {/* Study Place Image */}
      {place.image_url ? (
        <img
          src={place.image_url}
          alt={place.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📚</div>
            <p className="text-blue-600 font-medium">Study Spot</p>
          </div>
        </div>
      )}

      {/* Study Place Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {place.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3">
          {place.description || "No description available."}
        </p>

        {/* Status */}
        <div className="mb-3">
          <span className="text-sm text-gray-700">Status: </span>
          <span
            className={`text-sm font-medium ${
              place.is_available ? "text-green-600" : "text-red-600"
            }`}
          >
            {place.is_available ? "Available" : "Reservation Full"}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 text-sm mb-4">
          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-400" />
          <span>{place.location}</span>
        </div>

        {/* Reactions */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button
              onClick={() => onLike(place.id)}
              className="flex items-center space-x-1 cursor-pointer group"
              disabled={!userProfile}
            >
              {placeReactions.userLiked ? (
                <FaHeart className="w-4 h-4 text-red-500 fill-red-500" />
              ) : (
                <FaRegHeart className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
              )}
              <span
                className={`text-sm ${
                  placeReactions.userLiked
                    ? "text-red-500"
                    : "text-gray-600 group-hover:text-red-500"
                }`}
              >
                {placeReactions.likes}
              </span>
            </button>

            {/* Comments Button */}
            <button
              onClick={() => onViewComments(place)}
              className="flex items-center space-x-1 cursor-pointer group"
            >
              <FaRegComment className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              <span className="text-sm text-gray-600 group-hover:text-blue-500">
                {placeReactions.comments}
              </span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Library Staff Actions */}
          {isOwner && (
            <>
              <Button
                onClick={() =>
                  onToggleAvailability(place.id, place.is_available)
                }
                className={`w-full ${
                  place.is_available
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {place.is_available ? "Set Unavailable" : "Set Available"}
              </Button>
              <Button
                onClick={() => onDeletePost(place.id)}
                variant="destructive"
                className="w-full"
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Delete Post
              </Button>
            </>
          )}

          {/* Student/Teacher Reservation Actions */}
          {canReserve && (
            <Button
              onClick={() => onReserve(place)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Reserve Now
            </Button>
          )}

          {userReservation && isStudentOrTeacher && (
            <Button
              onClick={() => onEditReservation(userReservation)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <FaEdit className="w-4 h-4 mr-2" />
              Edit Reservation
            </Button>
          )}

          {!place.is_available && isStudentOrTeacher && !userReservation && (
            <Button
              disabled
              className="w-full bg-gray-300 text-gray-600 cursor-not-allowed"
            >
              Reservation Full
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
