// src/components/MobileBottomNav.jsx
import { FaHome, FaUsers, FaBookmark, FaUser, FaPlus } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";

export function MobileBottomNav({
  userProfile,
  currentView,
  onHomeClick,
  onFollowingClick,
  onReservedClick,
  onProfileClick,
  onPost,
  reservedCount = 0,
}) {
  const isStudentOrTeacher =
    userProfile?.role === "student" || userProfile?.role === "teacher";
  const isLibraryStaff = userProfile?.role === "library_staff";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {/* Home Button */}
        <button
          onClick={onHomeClick}
          className={`flex flex-col items-center justify-center p-2 transition-colors flex-1 min-w-0 ${
            currentView === "dashboard"
              ? "text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <FaHome className="w-5 h-5 mb-1" />
          <span className="text-xs truncate">Home</span>
        </button>

        {/* Following Button - Only for Students/Teachers */}
        {isStudentOrTeacher && (
          <button
            onClick={onFollowingClick}
            className={`flex flex-col items-center justify-center p-2 transition-colors flex-1 min-w-0 ${
              currentView === "following"
                ? "text-red-600"
                : "text-gray-600 hover:text-red-600"
            }`}
          >
            <FaUsers className="w-5 h-5 mb-1" />
            <span className="text-xs truncate">Following</span>
          </button>
        )}

        {/* Reserved Button - Only for Students/Teachers */}
        {!isLibraryStaff && (
          <button
            onClick={onReservedClick}
            className={`flex flex-col items-center justify-center p-2 transition-colors flex-1 min-w-0 ${
              currentView === "reserved"
                ? "text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            <div className="relative">
              <FaBookmark className="w-5 h-5 mb-1" />
              {reservedCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-xs bg-green-500">
                  {reservedCount}
                </Badge>
              )}
            </div>
            <span className="text-xs truncate">Reserved</span>
          </button>
        )}

        {/* Post Button - Only for Library Staff */}
        {isLibraryStaff && (
          <button
            onClick={onPost}
            className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-green-600 transition-colors flex-1 min-w-0"
          >
            <FaPlus className="w-5 h-5 mb-1" />
            <span className="text-xs truncate">Post</span>
          </button>
        )}

        {/* Profile Button */}
        <button
          onClick={onProfileClick}
          className={`flex flex-col items-center justify-center p-2 transition-colors flex-1 min-w-0 ${
            currentView === "profile"
              ? "text-purple-600"
              : "text-gray-600 hover:text-purple-600"
          }`}
        >
          <FaUser className="w-5 h-5 mb-1" />
          <span className="text-xs truncate">Profile</span>
        </button>
      </div>
    </div>
  );
}
