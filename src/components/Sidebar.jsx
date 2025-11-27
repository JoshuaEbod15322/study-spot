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
  FaBookmark,
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
  onReservedClick,
  currentView,
  settingsOpen,
  signingOut,
  reservedCount = 0,
  isMobile = false,
}) {
  const isStudentOrTeacher =
    userProfile?.role === "student" || userProfile?.role === "teacher";
  const isLibraryStaff = userProfile?.role === "library_staff";

  // Mobile bottom navigation render
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center py-2">
          {/* Home navigation button */}
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

          {/* Following navigation button */}
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

          {/* Reserved navigation button */}
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
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-xs">
                    {reservedCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs truncate">Reserved</span>
            </button>
          )}

          {/* Post creation button */}
          {isLibraryStaff && (
            <button
              onClick={onPost}
              className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-green-600 transition-colors flex-1 min-w-0"
            >
              <FaPlus className="w-5 h-5 mb-1" />
              <span className="text-xs truncate">Post</span>
            </button>
          )}

          {/* Profile navigation button */}
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

          {/* Settings menu button */}
          <button
            onClick={onSettingsToggle}
            className="flex flex-col items-center justify-center p-2 text-gray-600 hover:text-gray-800 transition-colors flex-1 min-w-0"
          >
            <FaCog className="w-5 h-5 mb-1" />
            <span className="text-xs truncate">Menu</span>
          </button>
        </div>

        {/* Mobile settings dropdown menu */}
        {settingsOpen && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="p-3 space-y-2">
              {/* Library staff approval management */}
              {isLibraryStaff && (
                <>
                  <button
                    onClick={onApprovals}
                    className="flex items-center space-x-3 px-3 py-2 w-full text-left text-gray-700 hover:bg-gray-50 rounded-lg group"
                  >
                    <FaClock className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                    <span className="text-sm">Approvals</span>
                    {pendingApprovals.length > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {pendingApprovals.length}
                      </Badge>
                    )}
                  </button>
                  {/* Reservation management */}
                  <button
                    onClick={onReservations}
                    className="flex items-center space-x-3 px-3 py-2 w-full text-left text-gray-700 hover:bg-gray-50 rounded-lg group"
                  >
                    <FaCalendarAlt className="w-4 h-4 text-gray-500 group-hover:text-purple-500" />
                    <span className="text-sm">Reservations</span>
                  </button>
                </>
              )}

              {/* User sign out action */}
              <button
                onClick={onSignOut}
                disabled={signingOut}
                className={`flex items-center space-x-3 px-3 py-2 w-full text-left transition-colors rounded-lg group ${
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
          </div>
        )}
      </div>
    );
  }

  // Desktop sidebar navigation render
  return (
    <div className="w-64 bg-white shadow-lg flex flex-col fixed left-0 top-0 h-screen overflow-y-auto z-40">
      {/* App header section */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900">Study Spot</h1>
        </div>
      </div>

      {/* Main navigation menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
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

          {/* Following feed navigation */}
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

          {/* Reserved places navigation */}
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

          {/* Library staff specific navigation */}
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
              {/* Approval management navigation */}
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
              {/* Reservation management navigation */}
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

          {/* User profile navigation */}
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

      {/* Settings and sign out section */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
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
