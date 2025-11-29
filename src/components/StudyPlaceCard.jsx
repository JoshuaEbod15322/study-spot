import { memo, useState, useMemo } from "react";
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
import "../responsive.css";

const StudyPlaceCard = memo(
  ({
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
  }) => {
    // Memoize expensive calculations
    const placeReactions = useMemo(
      () => reactions[place.id] || { likes: 0, comments: 0, userLiked: false },
      [reactions, place.id]
    );

    const isStudentOrTeacher = useMemo(
      () => userProfile?.role === "student" || userProfile?.role === "teacher",
      [userProfile]
    );

    const canReserve = useMemo(
      () => isStudentOrTeacher && place.is_available && !userReservation,
      [isStudentOrTeacher, place.is_available, userReservation]
    );

    const isLibraryStaff = useMemo(
      () => userProfile?.role === "library_staff",
      [userProfile]
    );

    const isOwner = useMemo(
      () => isLibraryStaff && place.created_by === userProfile?.id,
      [isLibraryStaff, place.created_by, userProfile]
    );

    const creator = place.creator || place.users;
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Optimize image URL
    const optimizedImageUrl = useMemo(() => {
      if (!place.image_url || imageError) return null;
      // Add image optimization parameters if using an image service
      return place.image_url;
    }, [place.image_url, imageError]);

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden min-h-[480px] w-full flex flex-col">
        {/* User Profile Section */}
        <div className="p-4 flex items-center space-x-3">
          {creator && (
            <div className="flex items-center space-x-3">
              {creator.profile_picture_url ? (
                <img
                  src={creator.profile_picture_url}
                  alt={creator.name}
                  className="w-8 h-8 rounded-full object-cover"
                  loading="lazy"
                  width="32"
                  height="32"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <FaUser className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {creator.name || "Unknown User"}
              </span>
            </div>
          )}
        </div>

        {/* Image Section with optimized loading */}
        {optimizedImageUrl ? (
          <div className="w-full h-48 bg-gray-100 relative">
            <img
              src={optimizedImageUrl}
              alt={place.name}
              className={`w-full h-48 object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              width="400"
              height="192"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2" aria-hidden="true">
                    <FaMapMarkerAlt className="mx-auto text-blue-400" />
                  </div>
                  <p className="text-blue-600 font-medium">Loading...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2" aria-hidden="true">
                <FaMapMarkerAlt className="mx-auto text-blue-400" />
              </div>
              <p className="text-blue-600 font-medium">Study Spot</p>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {place.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {place.description || "No description available."}
          </p>

          {/* Status Section */}
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

          {/* Location Section */}
          <div className="flex items-center text-gray-600 text-sm mb-4">
            <FaMapMarkerAlt
              className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="line-clamp-1">{place.location}</span>
          </div>

          {/* Reactions Section */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              {/* Like Button */}
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

              {/* Comments Button */}
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

          {/* Action Buttons Section */}
          <div className="space-y-2 mt-auto">
            {/* Owner Actions */}
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

            {/* Reserve Button */}
            {canReserve && (
              <Button
                onClick={() => onReserve(place)}
                className="responsive-button bg-blue-600 hover:bg-blue-700 touch-target w-full"
              >
                Reserve Now
              </Button>
            )}

            {/* Edit Reservation Button */}
            {userReservation && isStudentOrTeacher && (
              <Button
                onClick={() => onEditReservation(userReservation)}
                className="responsive-button bg-green-600 hover:bg-green-700 touch-target w-full"
              >
                <FaEdit className="w-4 h-4 mr-2" aria-hidden="true" />
                Edit Reservation
              </Button>
            )}

            {/* Reservation Full Button */}
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
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.place.id === nextProps.place.id &&
      prevProps.userReservation?.id === nextProps.userReservation?.id &&
      prevProps.reactions[prevProps.place.id]?.userLiked ===
        nextProps.reactions[nextProps.place.id]?.userLiked &&
      prevProps.place.is_available === nextProps.place.is_available &&
      prevProps.userProfile?.role === nextProps.userProfile?.role
    );
  }
);

StudyPlaceCard.displayName = "StudyPlaceCard";

export { StudyPlaceCard };
