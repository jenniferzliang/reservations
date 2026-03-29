"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, parse } from "date-fns";
import { ReservationCard, type Reservation } from "./ReservationCard";
import { QuickAddModal } from "./QuickAddModal";

export default function ManifestPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dateParam, setDateParam] = useState(format(new Date(), "yyyy-MM-dd"));
  const [maxSeatingDuration, setMaxSeatingDuration] = useState(75);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const fetchReservations = useCallback(async () => {
    const res = await fetch(`/api/reservations?date=${dateParam}`);
    if (res.ok) {
      setReservations(await res.json());
    }
  }, [dateParam]);

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(fetchReservations, 30000);
    return () => clearInterval(interval);
  }, [fetchReservations]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.maxSeatingDuration) setMaxSeatingDuration(data.maxSeatingDuration);
      })
      .catch(() => {});
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchReservations();
  }

  const activeReservations = reservations.filter((r) => r.status !== "CANCELLED");
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED");
  const seated = reservations.filter((r) => r.status === "ARRIVED");
  const totalCovers = activeReservations.reduce((sum, r) => sum + r.partySize, 0);
  const completed = reservations.filter((r) => r.status === "COMPLETED");

  // Sort: Overdue CONFIRMED first, then ARRIVED, then upcoming CONFIRMED, then rest.
  // Memoized because it re-parses every reservation time on each render otherwise.
  const sortedReservations = useMemo(() => {
    const now = new Date();
    function getSortKey(r: Reservation): number {
      if (r.status === "CONFIRMED") {
        const slotTime = parse(`${dateParam} ${r.time}`, "yyyy-MM-dd HH:mm", new Date());
        return slotTime <= now ? 0 : 2;
      }
      if (r.status === "ARRIVED") return 1;
      if (r.status === "NO_SHOW") return 3;
      if (r.status === "COMPLETED") return 4;
      return 9;
    }
    return [...activeReservations].sort((a, b) => {
      const sa = getSortKey(a);
      const sb = getSortKey(b);
      if (sa !== sb) return sa - sb;
      return a.time.localeCompare(b.time);
    });
  }, [activeReservations, dateParam]);

  const dateObj = parse(dateParam, "yyyy-MM-dd", new Date());

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-[2px] mb-1">
            Daily Manifest
          </h1>
          <p className="font-serif text-base italic text-tertiary">
            {format(dateObj, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateParam}
            onChange={(e) => setDateParam(e.target.value)}
            className="font-mono text-xs border border-border rounded-none px-2 py-1 sr-only"
            id="date-picker"
          />
          <label htmlFor="date-picker">
            {dateParam !== format(new Date(), "yyyy-MM-dd") && (
              <button
                className="font-mono text-[10px] uppercase tracking-[1px] border border-border bg-transparent px-3 py-2 rounded-none cursor-pointer hover:bg-hover transition-colors mr-3"
                onClick={() => setDateParam(format(new Date(), "yyyy-MM-dd"))}
              >
                Today
              </button>
            )}
          </label>
          <button
            className="font-mono text-[11px] uppercase tracking-[2px] bg-foreground text-white border-none px-5 py-3 rounded-none cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2"
            onClick={() => setShowQuickAdd(true)}
          >
            <span className="text-base leading-none">+</span> Quick Add
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="border border-border rounded-none grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border mb-8">
        {[
          { value: confirmed.length, label: "Confirmed" },
          { value: seated.length, label: "Seated" },
          { value: totalCovers, label: "Total Covers" },
          { value: completed.length, label: "Completed" },
        ].map((stat) => (
          <div key={stat.label} className="text-center py-5">
            <p className="font-mono text-2xl font-bold">{stat.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-[1px] text-secondary">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Reservation Cards */}
      {sortedReservations.length === 0 ? (
        <p className="font-serif text-sm italic text-secondary text-center py-12">
          No reservations for this day.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedReservations.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              dateParam={dateParam}
              maxSeatingDuration={maxSeatingDuration}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal
          dateParam={dateParam}
          onClose={() => setShowQuickAdd(false)}
          onAdded={fetchReservations}
        />
      )}
    </div>
  );
}
