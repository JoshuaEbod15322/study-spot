// src/components/ReservedView.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function ReservedView({ user, onBackToDashboard, userProfile }) {
  const [reservedPlaces, setReservedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchReservedPlaces();
    }
  }, [user]);

  // Reserved places data fetch
  const fetchReservedPlaces = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          *,
          study_place:study_places(
            id,
            name,
            description,
            location,
            image_url,
            created_by,
            creator:users(name, profile_picture_url)
          )
        `
        )
        .eq("user_id", user.id)
        .in("status", ["pending", "confirmed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReservedPlaces(data || []);
    } catch (error) {
      console.error("Error fetching reserved places:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reservation cancellation handler
  const handleCancelReservation = async (reservationId) => {
    try {
      setCancellingId(reservationId);

      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;

      setReservedPlaces((prev) =>
        prev.filter((reservation) => reservation.id !== reservationId)
      );
    } catch (error) {
      console.error("Error cancelling reservation:", error);
    } finally {
      setCancellingId(null);
    }
  };

  // Status badge display helper
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      completed: { variant: "outline", label: "Completed" },
    };

    const config = statusConfig[status] || {
      variant: "outline",
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Time formatting helper
  const formatTime = (timeString) => {
    return format(new Date(`2000-01-01T${timeString}`), "h:mm a");
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Reserved Places
          </h1>
          <p className="text-gray-600">Manage your study place reservations</p>
        </div>
      </div>

      {/* Empty State */}
      {reservedPlaces.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 text-lg mb-2">
              No reserved places yet.
            </div>
            <p className="text-gray-400">
              Reserve a study place to see it here!
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Reservations List */
        <div className="space-y-4">
          {reservedPlaces.map((reservation) => (
            <Card key={reservation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-xl">
                        {reservation.study_place?.name || "Unknown Place"}
                      </CardTitle>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {reservation.study_place?.location ||
                        "No location specified"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Reservation Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Date</p>
                    <p className="text-gray-900">
                      {format(
                        new Date(reservation.reservation_date),
                        "MMMM do, yyyy"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Time Slot
                    </p>
                    <p className="text-gray-900">
                      {formatTime(reservation.start_time)} -{" "}
                      {formatTime(reservation.end_time)}
                    </p>
                  </div>
                </div>

                {/* Description Section */}
                {reservation.study_place?.description && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      Description
                    </p>
                    <p className="text-gray-600 text-sm">
                      {reservation.study_place.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCancelReservation(reservation.id)}
                    disabled={cancellingId === reservation.id}
                  >
                    {cancellingId === reservation.id
                      ? "Cancelling..."
                      : "Cancel Reservation"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
