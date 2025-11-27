// src/components/Sidebar.jsx
import {
  FaHome,
  FaHeart,
  FaMapMarkerAlt,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
  FaPlus,
  FaClock,
  FaCalendarAlt,
  FaUsers,
  FaBookmark, // Added for reserved icon
} from "react-icons/fa";
import { Badge } from "@/components/ui/badge";

export function Sidebar({
  userProfile,
  pendingApprovals,
  onPost,
  onApprovals,
  onReservations,
  onSignOut,
  onSettingsToggle,
  onProfileClick,
  onHomeClick,
  onFollowingClick,
  onReservedClick, // Add this new prop
  currentView,
  settingsOpen,
  signingOut,
  reservedCount = 0, // Add reserved count for badge
}) {
  // Determine if user is student or teacher (can follow library staff)
  const isStudentOrTeacher =
    userProfile?.role === "student" || userProfile?.role === "teacher";
  const isLibraryStaff = userProfile?.role === "library_staff";

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col fixed left-0 top-0 h-screen overflow-y-auto z-40">
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900">Study Spot</h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {/* Home Link - All Posts */}
          <li>
            <button
              onClick={onHomeClick}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left group ${
                currentView === "dashboard"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaHome
                className={`w-5 h-5 ${
                  currentView === "dashboard"
                    ? "text-blue-600"
                    : "group-hover:text-blue-700"
                }`}
              />
              <span className="font-medium">All Posts</span>
            </button>
          </li>

          {/* Following Link - ONLY for Students and Teachers */}
          {isStudentOrTeacher && (
            <li>
              <button
                onClick={onFollowingClick}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left group ${
                  currentView === "following"
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaUsers
                  className={`w-5 h-5 ${
                    currentView === "following"
                      ? "text-red-600"
                      : "group-hover:text-red-500"
                  }`}
                />
                <span>Following</span>
              </button>
            </li>
          )}

          {/* Reserved Link - Show only for Students and Teachers */}
          {!isLibraryStaff && (
            <li>
              <button
                onClick={onReservedClick}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left group ${
                  currentView === "reserved"
                    ? "bg-green-50 text-green-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaBookmark
                  className={`w-5 h-5 ${
                    currentView === "reserved"
                      ? "text-green-600"
                      : "group-hover:text-green-500"
                  }`}
                />
                <span>Reserved</span>
                {reservedCount > 0 && (
                  <Badge variant="default" className="ml-auto bg-green-500">
                    {reservedCount}
                  </Badge>
                )}
              </button>
            </li>
          )}

          {/* Library Staff Only Features */}
          {isLibraryStaff && (
            <>
              <li>
                <button
                  onClick={onPost}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 group w-full text-left"
                >
                  <FaPlus className="w-5 h-5 group-hover:text-green-500" />
                  <span>Post</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onApprovals}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 group w-full text-left"
                >
                  <FaClock className="w-5 h-5 group-hover:text-orange-500" />
                  <span>Approvals</span>
                  {pendingApprovals.length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {pendingApprovals.length}
                    </Badge>
                  )}
                </button>
              </li>
              <li>
                <button
                  onClick={onReservations}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 group w-full text-left"
                >
                  <FaCalendarAlt className="w-5 h-5 group-hover:text-purple-500" />
                  <span>Reservations</span>
                </button>
              </li>
            </>
          )}

          {/* Profile Link - Show for all users */}
          <li>
            <button
              onClick={onProfileClick}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left group ${
                currentView === "profile"
                  ? "bg-purple-50 text-purple-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaUser
                className={`w-5 h-5 ${
                  currentView === "profile"
                    ? "text-purple-600"
                    : "group-hover:text-purple-500"
                }`}
              />
              <span>Profile</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Settings Dropdown */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0 settings-dropdown">
        <div className="relative">
          <button
            onClick={onSettingsToggle}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg group transition-colors ${
              settingsOpen
                ? "bg-gray-50 text-gray-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FaCog className="w-5 h-5" />
              <span>Settings</span>
            </div>
            <FaChevronDown
              className={`w-4 h-4 transition-transform ${
                settingsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {settingsOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={onSignOut}
                disabled={signingOut}
                className={`flex items-center space-x-3 px-3 py-2 w-full text-left transition-colors group ${
                  signingOut
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <FaSignOutAlt
                  className={`w-4 h-4 ${
                    signingOut
                      ? "text-gray-400"
                      : "text-gray-500 group-hover:text-red-600"
                  }`}
                />
                <span className="text-sm">
                  {signingOut ? "Signing Out..." : "Sign Out"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
