import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FaCheck,
  FaTimes,
  FaComment,
  FaCalendar,
  FaTrash,
} from "react-icons/fa";
import { format } from "date-fns";
import "../responsive.css";

// Generate time options from 8:00 to 20:00 in 30-minute intervals
const timeOptions = [];
for (let hour = 8; hour <= 20; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const timeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    timeOptions.push(timeString);
  }
}

//Creating new study places
export function PostModal({
  open,
  onOpenChange,
  newPost,
  onPostChange,
  onImageChange,
  onSubmit,
  uploading,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Study Place</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Study Place Name *</Label>
            <Input
              id="name"
              type="text"
              required
              value={newPost.name}
              onChange={(e) => onPostChange("name", e.target.value)}
              placeholder="Enter name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              required
              value={newPost.description}
              onChange={(e) => onPostChange("description", e.target.value)}
              placeholder="Enter description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              type="text"
              required
              value={newPost.location}
              onChange={(e) => onPostChange("location", e.target.value)}
              placeholder="Enter location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image (Optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={onImageChange}
            />
            <p className="text-xs text-gray-500">JPG and PNG. Max 5MB</p>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Creating..." : "Create Study Place"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

//Reserving study spaces
export function ReserveModal({
  open,
  onOpenChange,
  selectedPlace,
  reservationData,
  onReservationChange,
  onReserve,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Reserve Study Space</DialogTitle>
          <p>
            {selectedPlace?.name} • {selectedPlace?.location}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Select Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-12 px-4"
                >
                  <FaCalendar className="mr-3 h-4 w-4" />
                  {reservationData.date ? (
                    format(reservationData.date, "EEEE, MMMM d, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reservationData.date}
                  onSelect={(date) => onReservationChange("date", date)}
                  disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Start Time *</Label>
              <Select
                value={reservationData.startTime}
                onValueChange={(value) =>
                  onReservationChange("startTime", value)
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>End Time *</Label>
              <Select
                value={reservationData.endTime}
                onValueChange={(value) => onReservationChange("endTime", value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {reservationData.date &&
            reservationData.startTime &&
            reservationData.endTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4>Reservation Summary</h4>
                <p>
                  <strong>Date:</strong>{" "}
                  {format(reservationData.date, "MMMM d, yyyy")}
                </p>
                <p>
                  <strong>Time:</strong> {reservationData.startTime} -{" "}
                  {reservationData.endTime}
                </p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {(() => {
                    const start = parseInt(
                      reservationData.startTime.split(":")[0]
                    );
                    const end = parseInt(reservationData.endTime.split(":")[0]);
                    return `${end - start} hour${end - start !== 1 ? "s" : ""}`;
                  })()}
                </p>
              </div>
            )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onReserve}
            disabled={
              !reservationData.date ||
              !reservationData.startTime ||
              !reservationData.endTime
            }
          >
            Reserve Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

//Editing existing reservations
export function EditReservationModal({
  open,
  onOpenChange,
  selectedReservation,
  reservationData,
  onReservationChange,
  onUpdate,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Reservation</DialogTitle>
          <p>
            {selectedReservation?.study_place?.name} •{" "}
            {selectedReservation?.study_place?.location}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Select Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-12 px-4"
                >
                  <FaCalendar className="mr-3 h-4 w-4" />
                  {reservationData.date ? (
                    format(reservationData.date, "EEEE, MMMM d, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reservationData.date}
                  onSelect={(date) => onReservationChange("date", date)}
                  disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Start Time *</Label>
              <Select
                value={reservationData.startTime}
                onValueChange={(value) =>
                  onReservationChange("startTime", value)
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>End Time *</Label>
              <Select
                value={reservationData.endTime}
                onValueChange={(value) => onReservationChange("endTime", value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {reservationData.date &&
            reservationData.startTime &&
            reservationData.endTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4>Updated Reservation</h4>
                <p>
                  <strong>Date:</strong>{" "}
                  {format(reservationData.date, "MMMM d, yyyy")}
                </p>
                <p>
                  <strong>Time:</strong> {reservationData.startTime} -{" "}
                  {reservationData.endTime}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Note: Updating requires re-approval.
                </p>
              </div>
            )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onUpdate}
            disabled={
              !reservationData.date ||
              !reservationData.startTime ||
              !reservationData.endTime
            }
          >
            Update Reservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

//Viewing and adding comments
export function CommentsModal({
  open,
  onOpenChange,
  selectedPlace,
  comments,
  newComment,
  onCommentChange,
  onAddComment,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <p>
            {selectedPlace?.name} • {comments.length} comment
            {comments.length !== 1 ? "s" : ""}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-4 border rounded-lg p-4 bg-gray-50">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-lg p-4 shadow-sm border"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">
                    {comment.user?.name || "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(
                      new Date(comment.created_at),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-8">
                <FaComment className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No comments yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Be the first to comment!
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Input
              value={newComment}
              onChange={onCommentChange}
              placeholder="Write your comment..."
              onKeyPress={(e) => e.key === "Enter" && onAddComment()}
              className="flex-1 h-12"
            />
            <Button onClick={onAddComment} disabled={!newComment.trim()}>
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

//Approving/rejecting pending reservations
export function ApprovalsModal({
  open,
  onOpenChange,
  pendingApprovals,
  onApprove,
  onReject,
  onDelete,
}) {
  const [processingId, setProcessingId] = useState(null);
  const [localApprovals, setLocalApprovals] = useState(pendingApprovals);

  // Update local state when prop changes
  useEffect(() => {
    setLocalApprovals(pendingApprovals);
  }, [pendingApprovals]);

  const handleAction = async (action, reservationId, isDelete = false) => {
    setProcessingId(reservationId);
    try {
      const result = await action(reservationId);
      // If it's a delete action and successful, update local state immediately
      if (isDelete && result?.success) {
        setLocalApprovals((prev) =>
          prev.filter((approval) => approval.id !== reservationId)
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Pending Approvals</DialogTitle>
          <p>
            {localApprovals.length} pending request
            {localApprovals.length !== 1 ? "s" : ""}
          </p>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-4">
          {localApprovals.map((approval) => (
            <div
              key={approval.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4>{approval.study_place?.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {approval.study_place?.location}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Requested by:</span>
                        <p>{approval.user?.name || "Unknown User"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>
                        <p>{approval.user?.email || "No email"}</p>
                      </div>
                      <div>
                        <span className="font-medium">User Role:</span>
                        <p className="capitalize">
                          {approval.user?.role?.replace("_", " ") || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Reservation Date:</span>
                        <p>{approval.reservation_date}</p>
                      </div>
                      <div>
                        <span className="font-medium">Time Slot:</span>
                        <p>
                          {approval.start_time} - {approval.end_time}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p>
                          {(() => {
                            const start = parseInt(
                              approval.start_time?.split(":")[0]
                            );
                            const end = parseInt(
                              approval.end_time?.split(":")[0]
                            );
                            if (!isNaN(start) && !isNaN(end)) {
                              return `${end - start} hour${
                                end - start !== 1 ? "s" : ""
                              }`;
                            }
                            return "Unknown duration";
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Status:</span>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            approval.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : approval.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {approval.status?.charAt(0).toUpperCase() +
                            approval.status?.slice(1) || "Pending"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Requested:{" "}
                        {format(
                          new Date(approval.created_at),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleAction(onApprove, approval.id)}
                    disabled={processingId === approval.id}
                    className="bg-green-600 hover:bg-green-700 h-10 w-10"
                    title="Accept Reservation"
                  >
                    {processingId === approval.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaCheck className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(onReject, approval.id)}
                    disabled={processingId === approval.id}
                    className="h-10 w-10"
                    title="Reject Reservation"
                  >
                    {processingId === approval.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaTimes className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(onDelete, approval.id, true)}
                    disabled={processingId === approval.id}
                    className="h-10 w-10 border-red-300 text-red-600 hover:bg-red-50"
                    title="Delete Reservation"
                  >
                    {processingId === approval.id ? (
                      <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaTrash className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {localApprovals.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="w-8 h-8 text-green-600" />
              </div>
              <p>All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">
                No pending approvals.
              </p>
            </div>
          )}
        </div>

        {localApprovals.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800 text-center">
              • <strong>Checkmark</strong>: Accept reservation
              <br />• <strong>Red X</strong>: Reject reservation
              <br />• <strong>Trash</strong>: Delete reservation
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

//viewing user study place reservations
export function ReservationsModal({
  open,
  onOpenChange,
  userReservations,
  onDeleteReservation,
  userProfile,
  onRefresh,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [localReservations, setLocalReservations] = useState(userReservations);

  // Update local state when prop changes - this ensures modal reflects latest data
  useEffect(() => {
    if (userReservations && Array.isArray(userReservations)) {
      setLocalReservations(userReservations);
    }
  }, [userReservations, open]); // Also sync when modal opens

  // Refresh when modal opens
  useEffect(() => {
    if (open && onRefresh) {
      onRefresh();
    }
  }, [open, onRefresh]);

  const handleDelete = async (reservationId) => {
    setDeletingId(reservationId);
    try {
      // Update local state immediately for instant UI feedback
      setLocalReservations((prev) =>
        prev.filter((reservation) => reservation.id !== reservationId)
      );

      // Call the delete function and wait for it to complete
      const result = await onDeleteReservation(reservationId);

      // Always refresh after deletion to ensure we have the latest data
      if (onRefresh) {
        await onRefresh();
        // After refresh, sync local state with updated props
        // The useEffect will also handle this, but we do it here too for immediate update
      }

      // If deletion failed, the refresh above will restore the correct state
      if (result && !result.success) {
        console.error("Failed to delete reservation:", result.error);
      }
    } catch (error) {
      console.error("Error deleting reservation:", error);
      // On error, refresh to restore correct state
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>My Place Reservations</DialogTitle>
          <p>
            {localReservations.length} reservation
            {localReservations.length !== 1 ? "s" : ""} for your study places
          </p>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-4">
          {localReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4>{reservation.study_place?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {reservation.study_place?.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reservation.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : reservation.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : reservation.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {reservation.status === "confirmed"
                          ? "Accepted"
                          : reservation.status === "pending"
                          ? "Pending"
                          : reservation.status.charAt(0).toUpperCase() +
                            reservation.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Reserved by:</span>
                      <p>{reservation.user?.name}</p>
                      <p className="text-gray-500 text-xs">
                        {reservation.user?.email}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Date & Time:</span>
                      <p>{reservation.reservation_date}</p>
                      <p>
                        {reservation.start_time} - {reservation.end_time}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">User Role:</span>
                      <p className="capitalize">
                        {reservation.user?.role?.replace("_", " ") || "Unknown"}
                      </p>
                    </div>
                  </div>

                  {reservation.notes && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Notes:</span>
                      <p className="text-gray-600 text-sm mt-1">
                        {reservation.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(reservation.id)}
                    disabled={deletingId === reservation.id}
                    className="h-10 w-10"
                    title={`Delete Reservation (Status: ${reservation.status})`}
                  >
                    {deletingId === reservation.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaTrash className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {localReservations.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendar className="w-8 h-8 text-blue-600" />
              </div>
              <p>No reservations yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Students and teachers will appear here.
              </p>
            </div>
          )}
        </div>

        {localReservations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800 text-center">
              You can delete any reservation (pending, confirmed, or cancelled)
              by clicking the trash button.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
