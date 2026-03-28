"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, parse, addMinutes, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Users, AlertTriangle, X } from "lucide-react";

interface GuestSuggestion {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  instagram: string | null;
  allergies: string | null;
  visitCount: number;
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  partySize: number;
  firstName: string;
  lastName: string;
  phone: string;
  instagram?: string;
  allergies?: string;
  specialNotes?: string;
  isWalkIn?: boolean;
  status: string;
  guest: {
    visitCount: number;
  };
}

function InstagramIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

export default function ManifestPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dateParam, setDateParam] = useState(format(new Date(), "yyyy-MM-dd"));
  const [maxSeatingDuration, setMaxSeatingDuration] = useState(75);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAdd, setQuickAdd] = useState({
    firstName: "",
    lastName: "",
    instagram: "",
    phone: "",
    partySize: "2",
    allergies: "",
  });
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [guestSuggestion, setGuestSuggestion] = useState<GuestSuggestion | null>(null);
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const phoneLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePhoneChange(value: string) {
    setQuickAdd((prev) => ({ ...prev, phone: value }));
    setGuestSuggestion(null);

    if (phoneLookupTimer.current) clearTimeout(phoneLookupTimer.current);

    // Only look up once we have enough digits
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) return;

    setPhoneLookupLoading(true);
    phoneLookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/guests/lookup?phone=${encodeURIComponent(value)}`);
        if (res.ok) {
          const { guest } = await res.json();
          if (guest) setGuestSuggestion(guest);
        }
      } finally {
        setPhoneLookupLoading(false);
      }
    }, 300);
  }

  function closeQuickAdd() {
    setShowQuickAdd(false);
    setQuickAdd({ firstName: "", lastName: "", instagram: "", phone: "", partySize: "2", allergies: "" });
    setGuestSuggestion(null);
  }

  function acceptGuestSuggestion() {
    if (!guestSuggestion) return;
    setQuickAdd((prev) => ({
      ...prev,
      firstName: guestSuggestion.firstName,
      lastName: guestSuggestion.lastName || "",
      instagram: guestSuggestion.instagram || "",
      allergies: guestSuggestion.allergies || "",
    }));
  }

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

  async function handleQuickAdd() {
    if (!quickAdd.firstName.trim() || !quickAdd.phone.trim() || !quickAdd.partySize) return;
    setQuickAddSubmitting(true);
    const now = new Date();
    const time = format(now, "HH:mm");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateParam,
          time,
          firstName: quickAdd.firstName.trim(),
          lastName: quickAdd.lastName.trim(),
          phone: quickAdd.phone.trim() || undefined,
          instagram: quickAdd.instagram.trim() || undefined,
          partySize: parseInt(quickAdd.partySize),
          allergies: quickAdd.allergies.trim() || undefined,
          isWalkIn: true,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        // Immediately seat the walk-in
        await fetch(`/api/reservations/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ARRIVED" }),
        });
        closeQuickAdd();
        fetchReservations();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to add walk-in");
      }
    } finally {
      setQuickAddSubmitting(false);
    }
  }

  const activeReservations = reservations.filter((r) => r.status !== "CANCELLED");
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED");
  const seated = reservations.filter((r) => r.status === "ARRIVED");
  const totalCovers = activeReservations.reduce((sum, r) => sum + r.partySize, 0);
  const completed = reservations.filter((r) => r.status === "COMPLETED");

  // Sort: Overdue CONFIRMED first, then ARRIVED, then upcoming CONFIRMED, then rest
  const now = new Date();
  function getSortKey(r: Reservation): number {
    if (r.status === "CONFIRMED") {
      const slotTime = parse(`${dateParam} ${r.time}`, "yyyy-MM-dd HH:mm", new Date());
      if (slotTime <= now) return 0; // Overdue — top priority
      return 2; // Upcoming confirmed
    }
    if (r.status === "ARRIVED") return 1;
    if (r.status === "NO_SHOW") return 3;
    if (r.status === "COMPLETED") return 4;
    return 9;
  }
  const sortedReservations = [...activeReservations].sort((a, b) => {
    const sa = getSortKey(a);
    const sb = getSortKey(b);
    if (sa !== sb) return sa - sb;
    return a.time.localeCompare(b.time);
  });

  const dateObj = parse(dateParam, "yyyy-MM-dd", new Date());

  function getTimeRange(time: string) {
    const start = parse(time, "HH:mm", new Date());
    const end = addMinutes(start, maxSeatingDuration);
    return `${format(start, "h:mm a")} — ${format(end, "h:mm a")}`;
  }

  function getSlotLabel(time: string): { label: string; color: "green" | "gray" | "red" } {
    const now = new Date();
    const slotDateTime = parse(
      `${dateParam} ${time}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );
    if (slotDateTime <= now) {
      return { label: "Overdue", color: "red" };
    }
    const mins = differenceInMinutes(slotDateTime, now);
    if (mins < 60) {
      return { label: `In ${mins}m`, color: "green" };
    }
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return { label: `In ${hrs}h ${rem}m`, color: "green" };
  }

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
          <div
            key={stat.label}
            className="text-center py-5"
          >
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
          {sortedReservations.map((r) => {
            const isSeated = r.status === "ARRIVED";
            const isNoShow = r.status === "NO_SHOW";
            const isCompleted = r.status === "COMPLETED";
            const isConfirmed = r.status === "CONFIRMED";
            const slotInfo = isConfirmed ? getSlotLabel(r.time) : null;

            return (
              <div
                key={r.id}
                className={`border rounded-none ${
                  isNoShow || isCompleted
                    ? "border-border opacity-40"
                    : isConfirmed && slotInfo?.color === "red"
                    ? "border-error border-l-4"
                    : "border-border"
                }`}
              >
                {/* Card header */}
                <div
                  className={`flex items-center justify-between px-6 py-3 ${
                    isSeated
                      ? "bg-success-bg border-b-2 border-b-error"
                      : "border-b border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSeated
                          ? "bg-success"
                          : isNoShow
                          ? "bg-muted"
                          : isCompleted
                          ? "bg-muted"
                          : slotInfo?.color === "red"
                          ? "bg-error"
                          : slotInfo?.color === "green"
                          ? "bg-success"
                          : "bg-muted"
                      }`}
                    />
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[1px] ${
                        isSeated
                          ? "text-success"
                          : isNoShow
                          ? "text-secondary"
                          : isCompleted
                          ? "text-secondary"
                          : slotInfo?.color === "red"
                          ? "text-error font-bold"
                          : slotInfo?.color === "green"
                          ? "text-success"
                          : "text-secondary"
                      }`}
                    >
                      {isSeated
                        ? "Seated"
                        : isNoShow
                        ? "No Show"
                        : isCompleted
                        ? "Completed"
                        : slotInfo?.label}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[1px] ${
                      isSeated
                        ? "text-success"
                        : isNoShow || isCompleted
                        ? "text-secondary"
                        : slotInfo?.color === "red"
                        ? "text-error font-bold"
                        : slotInfo?.color === "green"
                        ? "text-success"
                        : "text-secondary"
                    }`}
                  >
                    {getTimeRange(r.time)}
                  </span>
                </div>

                {/* Card body */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-5 gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-lg font-bold">
                        {r.firstName} {r.lastName}
                      </span>
                      {r.isWalkIn && (
                        <span className="font-mono text-[10px] border border-warning-border bg-warning-bg text-warning-text px-2 py-0.5 rounded-none uppercase">
                          Walk-in
                        </span>
                      )}
                      {r.guest.visitCount > 1 && (
                        <span className="font-mono text-[10px] border border-border px-2 py-0.5 rounded-none uppercase">
                          {r.guest.visitCount}&times; guest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-secondary">
                      <span className="font-mono text-xs inline-flex items-center gap-1">
                        <InstagramIcon />
                        {r.instagram ? `@${r.instagram.replace(/^@/, "")}` : ""}
                      </span>
                      <span className="font-mono text-xs inline-flex items-center gap-1">
                        <Users size={12} strokeWidth={1.5} className="relative top-[0.5px]" />
                        {r.partySize} {r.partySize === 1 ? "cover" : "covers"}
                      </span>
                    </div>
                    {r.allergies && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="font-mono text-[10px] uppercase tracking-[1px] text-secondary inline-flex items-center gap-1">
                          <AlertTriangle size={11} strokeWidth={1.5} className="text-error relative top-[0.5px]" />
                          Allergy:
                        </span>
                        <span className="font-mono text-[10px] text-error">
                          {r.allergies}
                        </span>
                      </div>
                    )}
                    {r.specialNotes && (
                      <p className="font-serif text-xs italic text-secondary mt-1.5">
                        &ldquo;{r.specialNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  {isConfirmed && (
                    <div className="flex gap-2 shrink-0 sm:ml-4">
                      <Button
                        className="!w-auto !py-2.5 !px-5 text-[10px]"
                        onClick={() => updateStatus(r.id, "ARRIVED")}
                      >
                        Check In
                      </Button>
                      <Button
                        variant="outlined"
                        className="!w-auto !py-2.5 !px-5 text-[10px]"
                        onClick={() => updateStatus(r.id, "NO_SHOW")}
                      >
                        No Show
                      </Button>
                    </div>
                  )}
                  {isSeated && (
                    <div className="shrink-0 sm:ml-4">
                      <Button
                        variant="outlined"
                        className="!w-auto !py-2.5 !px-5 text-[10px]"
                        onClick={() => updateStatus(r.id, "COMPLETED")}
                      >
                        Complete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeQuickAdd}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white border border-border rounded-none shadow-lg max-w-[560px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[2px]">
                Quick Add — Walk-in
              </h3>
              <button
                onClick={closeQuickAdd}
                className="cursor-pointer hover:opacity-60 border border-border rounded-full p-1"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-6">
              {/* Row 1: Phone + Party Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[1px] text-foreground mb-1.5 block">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    autoFocus
                    value={quickAdd.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full border border-border rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-foreground"
                  />
                  {phoneLookupLoading && (
                    <p className="font-mono text-[10px] text-secondary mt-1">Looking up guest...</p>
                  )}
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[1px] text-foreground mb-1.5 block">
                    Party Size *
                  </label>
                  <select
                    value={quickAdd.partySize}
                    onChange={(e) => setQuickAdd({ ...quickAdd, partySize: e.target.value })}
                    className="w-full border border-border rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-foreground bg-white appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                    <option value="9">8+</option>
                  </select>
                </div>
              </div>

              {/* Returning guest suggestion */}
              {guestSuggestion && (
                <button
                  type="button"
                  onClick={acceptGuestSuggestion}
                  className="w-full text-left border border-success bg-success-bg px-4 py-3 mb-4 cursor-pointer hover:bg-success-bg transition-colors"
                >
                  <p className="font-mono text-xs font-bold text-foreground">
                    Welcome back, {guestSuggestion.firstName}!
                  </p>
                  <p className="font-mono text-[10px] text-tertiary mt-0.5">
                    {guestSuggestion.visitCount}&times; guest
                    {guestSuggestion.instagram ? ` · @${guestSuggestion.instagram.replace(/^@/, "")}` : ""}
                    {" — tap to fill"}
                  </p>
                </button>
              )}

              {/* Row 2: Name + Instagram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[1px] text-foreground mb-1.5 block">
                    Name *
                  </label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={quickAdd.firstName}
                    onChange={(e) => setQuickAdd({ ...quickAdd, firstName: e.target.value })}
                    className="w-full border border-border rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[1px] text-foreground mb-1.5 block">
                    Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@handle"
                    value={quickAdd.instagram}
                    onChange={(e) => setQuickAdd({ ...quickAdd, instagram: e.target.value })}
                    className="w-full border border-border rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {/* Row 3: Allergies */}
              <div className="mb-4">
                <label className="font-mono text-[10px] uppercase tracking-[1px] text-foreground mb-1.5 block">
                  Allergies
                </label>
                <input
                  type="text"
                  value={quickAdd.allergies}
                  onChange={(e) => setQuickAdd({ ...quickAdd, allergies: e.target.value })}
                  className="w-full border border-border rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-foreground"
                />
              </div>

              <p className="font-mono text-[10px] uppercase tracking-[1px] text-secondary mb-4">
                Will be checked in immediately at {format(new Date(), "h:mm a")}.
              </p>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={closeQuickAdd}
                  className="font-mono text-[11px] uppercase tracking-[2px] border border-border bg-white text-foreground px-5 py-3 rounded-none cursor-pointer hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAdd}
                  disabled={quickAddSubmitting || !quickAdd.firstName.trim() || !quickAdd.phone.trim()}
                  className="font-mono text-[11px] uppercase tracking-[2px] bg-foreground text-white border-none px-5 py-3 rounded-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add & Seat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
