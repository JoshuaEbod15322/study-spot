import {
  FaUser,
  FaMapMarkerAlt,
  FaRegHeart,
  FaRegComment,
  FaHeart,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { UserClickCard } from "./Profile"; // Changed from UserHoverCard to UserClickCard

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

  // Creator information extraction
  const creator = place.creator || place.users;

  return (
    <div className="responsive-card">
      <div className="p-4 flex items-center space-x-3">
        {creator && (
          <UserClickCard user={creator}>
            {" "}
            {/* Changed from UserHoverCard to UserClickCard */}
            <div className="flex items-center space-x-3 cursor-pointer touch-target">
              {creator.profile_picture_url ? (
                <img
                  src={creator.profile_picture_url}
                  alt={creator.name}
                  className="w-8 h-8 rounded-full object-cover"
                  loading="lazy"
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
          </UserClickCard>
        )}
      </div>

      {/* Study place image display */}
      {place.image_url ? (
        <img
          src={place.image_url}
          alt={place.name}
          className="responsive-image"
          loading="lazy"
        />
      ) : (
        <div className="responsive-image bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2" aria-hidden="true">
              <FaMapMarkerAlt className="mx-auto text-blue-400" />
            </div>
            <p className="text-blue-600 font-medium">Study Spot</p>
          </div>
        </div>
      )}

      {/* Study place content section */}
      <div className="p-4">
        <h3 className="responsive-title mb-1">{place.name}</h3>
        <p className="responsive-text mb-3">
          {place.description || "No description available."}
        </p>

        {/* Availability status display */}
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

        {/* Location information */}
        <div className="flex items-center text-gray-600 text-sm mb-4">
          <FaMapMarkerAlt
            className="w-4 h-4 mr-2 text-gray-400"
            aria-hidden="true"
          />
          <span>{place.location}</span>
        </div>

        {/* Reaction buttons section */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike(place.id)}
              className="flex items-center space-x-1 cursor-pointer group touch-target"
              disabled={!userProfile}
              aria-label={placeReactions.userLiked ? "Unlike" : "Like"}
            >
              {placeReactions.userLiked ? (
                <FaHeart
                  className="w-4 h-4 text-red-500 fill-red-500"
                  aria-hidden="true"
                />
              ) : (
                <FaRegHeart
                  className="w-4 h-4 text-gray-400 group-hover:text-red-500"
                  aria-hidden="true"
                />
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

            {/* Comments view button */}
            <button
              onClick={() => onViewComments(place)}
              className="flex items-center space-x-1 cursor-pointer group touch-target"
              aria-label="View comments"
            >
              <FaRegComment
                className="w-4 h-4 text-gray-400 group-hover:text-blue-500"
                aria-hidden="true"
              />
              <span className="text-sm text-gray-600 group-hover:text-blue-500">
                {placeReactions.comments}
              </span>
            </button>
          </div>
        </div>

        {/* Action buttons section */}
        <div className="space-y-2">
          {isOwner && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() =>
                  onToggleAvailability(place.id, place.is_available)
                }
                className={`responsive-button ${
                  place.is_available
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
                } touch-target w-full`}
              >
                {place.is_available ? "Set Unavailable" : "Set Available"}
              </Button>
              {/* Post deletion button */}
              <Button
                onClick={() => onDeletePost(place.id)}
                variant="destructive"
                className="responsive-button touch-target w-full"
              >
                <FaTrash className="w-4 h-4 mr-2" aria-hidden="true" />
                Delete
              </Button>
            </div>
          )}

          {/* Initial reservation button */}
          {canReserve && (
            <Button
              onClick={() => onReserve(place)}
              className="responsive-button bg-blue-600 hover:bg-blue-700 touch-target w-full"
            >
              Reserve Now
            </Button>
          )}

          {/* Reservation edit button */}
          {userReservation && isStudentOrTeacher && (
            <Button
              onClick={() => onEditReservation(userReservation)}
              className="responsive-button bg-green-600 hover:bg-green-700 touch-target w-full"
            >
              <FaEdit className="w-4 h-4 mr-2" aria-hidden="true" />
              Edit Reservation
            </Button>
          )}

          {/* Full reservation state */}
          {!place.is_available && isStudentOrTeacher && !userReservation && (
            <Button
              disabled
              className="responsive-button bg-gray-300 text-gray-600 cursor-not-allowed w-full"
            >
              Reservation Full
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
