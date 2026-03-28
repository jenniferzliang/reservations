"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Phone, Trash2, Calendar, Clock, Users, TriangleAlert, X, GitMerge } from "lucide-react";

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  instagram?: string;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  totalGuests: number;
  allergies?: string;
  usualOrder?: string;
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
  status: string;
  specialNotes?: string;
}

interface Analytics {
  totalBookings: number;
  completedCount: number;
  noShowCount: number;
  totalCovers: number;
  returningGuests: number;
  allergyProfiles: number;
}

type Tab = "overview" | "bookings" | "profiles";
type BookingTab = "upcoming" | "past" | "all";

function InstagramIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

export default function GuestsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", instagram: "", allergies: "", usualOrder: "" });
  const [mergeGuest, setMergeGuest] = useState<Guest | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [deleteGuestTarget, setDeleteGuestTarget] = useState<Guest | null>(null);
  const [bookingTab, setBookingTab] = useState<BookingTab>("upcoming");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [overviewSort, setOverviewSort] = useState<"most" | "recent" | "oldest">("most");
  const [overviewSearch, setOverviewSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/guests").then((r) => r.json()),
      fetch("/api/reservations").then((r) => r.json()),
      fetch("/api/analytics").then((r) => r.json()),
    ])
      .then(([g, r, a]) => {
        setGuests(g);
        setReservations(r);
        setAnalytics(a);
      })
      .catch(console.error);
  }, []);

  async function updateReservationStatus(id: string, status: string) {
    const previous = reservations;
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setReservations(previous);
        alert("Failed to update status. Please try again.");
      }
    } catch {
      setReservations(previous);
      alert("Failed to update status. Please try again.");
    }
  }

  async function deleteReservation(id: string) {
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    setReservations((prev) => prev.filter((r) => r.id !== id));
  }

  async function deleteGuest(id: string) {
    await fetch(`/api/guests/${id}`, { method: "DELETE" });
    setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  function openEdit(g: Guest) {
    setEditGuest(g);
    setEditForm({
      name: `${g.firstName} ${g.lastName}`,
      phone: g.phone,
      instagram: g.instagram || "",
      allergies: g.allergies || "",
      usualOrder: g.usualOrder || "",
    });
  }

  async function saveEdit() {
    if (!editGuest) return;
    const [firstName, ...rest] = editForm.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || editGuest.lastName;
    await fetch(`/api/guests/${editGuest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: editForm.phone,
        instagram: editForm.instagram || null,
        allergies: editForm.allergies || null,
        usualOrder: editForm.usualOrder || null,
      }),
    });
    const res = await fetch("/api/guests");
    setGuests(await res.json());
    setEditGuest(null);
  }

  async function handleMerge() {
    if (!mergeGuest || !mergeTargetId) return;
    const res = await fetch("/api/guests/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceGuestId: mergeGuest.id, targetGuestId: mergeTargetId }),
    });
    if (!res.ok) {
      console.error("Merge failed:", await res.text());
      return;
    }
    const [guestsRes, reservationsRes] = await Promise.all([
      fetch("/api/guests").then((r) => r.json()),
      fetch("/api/reservations").then((r) => r.json()),
    ]);
    setGuests(guestsRes);
    setReservations(reservationsRes);
    setMergeGuest(null);
    setMergeTargetId("");
  }

  const filteredReservations = reservations.filter((r) => {
    if (r.date !== dateFilter) return false;

    const matchesSearch =
      !search ||
      `${r.firstName} ${r.lastName} ${r.phone} ${r.instagram || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;

    if (bookingTab === "upcoming") {
      return matchesSearch && matchesStatus && (r.status === "CONFIRMED" || r.status === "ARRIVED");
    }
    if (bookingTab === "past") {
      return matchesSearch && matchesStatus && r.status !== "CONFIRMED" && r.status !== "ARRIVED";
    }
    return matchesSearch && matchesStatus;
  });

  const filteredGuests = guests.filter(
    (g) =>
      !search ||
      `${g.firstName} ${g.lastName} ${g.phone} ${g.instagram || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // Overview computed values
  const overviewGuests = guests
    .filter(
      (g) =>
        !overviewSearch ||
        `${g.firstName} ${g.lastName} ${g.phone} ${g.instagram || ""}`
          .toLowerCase()
          .includes(overviewSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (overviewSort === "most") return b.visitCount - a.visitCount;
      if (overviewSort === "recent") return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      return new Date(a.firstVisit).getTime() - new Date(b.firstVisit).getTime();
    });

  const totalGuests = guests.length;
  const returningGuests = guests.filter((g) => g.visitCount > 1).length;
  const vipGuests = guests.filter((g) => g.visitCount >= 10).length;
  const avgVisits = totalGuests > 0 ? (guests.reduce((sum, g) => sum + g.visitCount, 0) / totalGuests).toFixed(1) : "0";
  const allergyNotes = guests.filter((g) => g.allergies).length;

  function relativeTime(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "today";
    if (diff === 1) return "~1d ago";
    if (diff < 7) return `~${diff}d ago`;
    if (diff < 30) return `~${Math.floor(diff / 7)}w ago`;
    return `~${Math.floor(diff / 30)}mo ago`;
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "bookings", label: "All Bookings" },
    { key: "profiles", label: "Guest Profiles" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-mono text-2xl font-bold uppercase tracking-[2px] mb-1">
        Owner Portal
      </h1>
      <p className="font-serif text-base italic mb-6">
        Full command over every booking and guest.
      </p>
      <hr className="border-[#E0E0E0] mb-6" />

      {/* Tabs */}
      <div className="flex mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-mono text-xs uppercase tracking-[1px] px-4 py-2 cursor-pointer transition-colors border border-[#E0E0E0] -ml-px first:ml-0 first:rounded-l-none last:rounded-r-none ${
              tab === t.key
                ? "bg-[#0D0D0D] text-white border-[#0D0D0D] z-10 relative"
                : "text-[#0D0D0D] hover:bg-[#F5F5F5] bg-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div>
          {/* Stats row */}
          <div className="border border-[#E0E0E0] rounded-none mb-6">
            <div className="grid grid-cols-5 divide-x divide-[#E0E0E0]">
              {[
                { value: totalGuests, label: "Total Guests" },
                { value: returningGuests, label: "Returning" },
                { value: vipGuests, label: "VIP (10+ Visits)" },
                { value: avgVisits, label: "Avg Visits" },
                { value: allergyNotes, label: "Allergy Notes" },
              ].map((stat) => (
                <div key={stat.label} className="p-4">
                  <p className="font-mono text-2xl font-bold">{stat.value}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[1px] text-[#888888] mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Search + Sort */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 border border-[#E0E0E0] rounded-none px-4 py-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, @handle, or phone..."
                value={overviewSearch}
                onChange={(e) => setOverviewSearch(e.target.value)}
                className="w-full bg-transparent border-none font-mono text-sm focus:outline-none"
              />
            </div>
            <div className="flex">
              {([
                { key: "most" as const, label: "Most Visits" },
                { key: "recent" as const, label: "Recent" },
                { key: "oldest" as const, label: "Oldest" },
              ]).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setOverviewSort(s.key)}
                  className={`font-mono text-[10px] uppercase tracking-[1px] px-4 py-2.5 cursor-pointer transition-colors border border-[#E0E0E0] -ml-px first:ml-0 ${
                    overviewSort === s.key
                      ? "bg-[#0D0D0D] text-white border-[#0D0D0D] z-10 relative"
                      : "text-[#0D0D0D] hover:bg-[#F5F5F5] bg-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Guest count */}
          <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888] mb-3">
            {overviewGuests.length} Guest{overviewGuests.length !== 1 ? "s" : ""}
          </p>

          {/* Guest cards */}
          <div className="flex flex-col gap-3">
            {overviewGuests.map((g) => (
              <div key={g.id} className="border border-[#E0E0E0] rounded-none p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-base">
                        {g.firstName} {g.lastName}
                      </span>
                      {g.visitCount <= 1 && (
                        <span className="font-mono text-[9px] uppercase tracking-[1px] text-[#888888] border border-[#E0E0E0] px-2 py-0.5">
                          New
                        </span>
                      )}
                      {g.visitCount >= 10 && (
                        <span className="font-mono text-[9px] uppercase tracking-[1px] text-[#C49B1A] border border-[#C49B1A] px-2 py-0.5">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#888888] flex items-center gap-1 mb-2">
                      <Phone size={12} strokeWidth={1.5} /> {g.phone}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] text-[#888888] uppercase tracking-[0.5px]">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} strokeWidth={1.5} /> First: {format(new Date(g.firstVisit), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} strokeWidth={1.5} /> Last: {format(new Date(g.lastVisit), "MMM d, yyyy")} ({relativeTime(g.lastVisit)})
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={10} strokeWidth={1.5} /> {g.totalGuests} total covers
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono text-2xl font-bold">{g.visitCount}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[1px] text-[#888888]">
                      Visits
                    </p>
                  </div>
                </div>
                {g.allergies && (
                  <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-none px-3 py-1.5 mt-2 inline-flex items-center gap-1.5">
                    <TriangleAlert size={11} strokeWidth={1.5} className="text-[#C45C4A]" />
                    <span className="font-serif text-xs italic text-[#C45C4A]">
                      {g.allergies}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Bookings */}
      {tab === "bookings" && (
        <div>
          {/* Search + Date + Status */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex-1 min-w-0 border border-[#E0E0E0] rounded-none px-3 py-2 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Name, @handle, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none font-mono text-xs focus:outline-none"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-xs focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-xs focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="ARRIVED">Arrived</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Sub-tabs */}
          <div className="flex mb-4">
            {([
              { key: "upcoming" as BookingTab, label: "Bookings" },
              { key: "past" as BookingTab, label: "Past Bookings" },
              { key: "all" as BookingTab, label: "All Bookings" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setBookingTab(t.key)}
                className={`flex-1 font-mono text-[10px] uppercase tracking-[1px] px-4 py-2.5 cursor-pointer transition-colors border border-[#E0E0E0] -ml-px first:ml-0 ${
                  bookingTab === t.key
                    ? "bg-[#0D0D0D] text-white border-[#0D0D0D] z-10 relative"
                    : "text-[#0D0D0D] hover:bg-[#F5F5F5] bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888] mb-3">
            {filteredReservations.length} Bookings
          </p>

          <div className="flex flex-col gap-2">
            {filteredReservations.map((r) => (
              <div
                key={r.id}
                className="border border-[#E0E0E0] rounded-none p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm">
                      {r.firstName} {r.lastName}
                    </span>
                    {r.instagram && (
                      <span className="font-mono text-xs text-[#888888] inline-flex items-center gap-1">
                        <InstagramIcon />
                        @{r.instagram.replace(/^@/, "")}
                      </span>
                    )}
                    <span className="font-mono text-xs text-[#888888] flex items-center gap-1">
                      <Phone size={12} strokeWidth={1.5} /> {r.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateReservationStatus(r.id, e.target.value)
                      }
                      className="font-mono text-[10px] uppercase border border-[#E0E0E0] rounded-none px-3 py-2 bg-transparent"
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="ARRIVED">Arrived</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="NO_SHOW">No Show</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="text-[#888888] hover:text-[#C45C4A] cursor-pointer"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <p className="font-mono text-[10px] text-[#888888] flex items-center gap-1">
                  <Calendar size={10} strokeWidth={1.5} /> {r.date} &nbsp; <Clock size={10} strokeWidth={1.5} /> {r.time} &nbsp;
                  <Users size={10} strokeWidth={1.5} /> {r.partySize}
                </p>
                {r.allergies && (
                  <div className="bg-[#FEF2F2] rounded-none px-3 py-1.5 mt-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#C45C4A] flex items-center gap-1">
                      <TriangleAlert size={11} strokeWidth={1.5} /> Allergy:
                    </span>
                    <span className="font-mono text-xs text-[#C45C4A]">
                      {r.allergies}
                    </span>
                  </div>
                )}
                {r.specialNotes && (
                  <p className="font-serif text-xs italic text-[#888888] mt-1">
                    &ldquo;{r.specialNotes}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Profiles */}
      {tab === "profiles" && (
        <div>
          <div className="border border-[#E0E0E0] rounded-none px-4 py-3 mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none font-mono text-sm focus:outline-none"
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888] mb-3">
            {filteredGuests.length} Guests
          </p>

          <div className="border border-[#E0E0E0] rounded-none divide-y divide-[#E0E0E0]">
            {filteredGuests.map((g) => (
              <div
                key={g.id}
                className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-base">
                      {g.firstName} {g.lastName}
                    </span>
                    {g.instagram && (
                      <span className="font-mono text-xs text-[#888888] inline-flex items-center gap-1">
                        <InstagramIcon />
                        @{g.instagram.replace(/^@/, "")}
                      </span>
                    )}
                    {!g.instagram && (
                      <span className="text-[#888888] inline-flex items-center">
                        <InstagramIcon />
                      </span>
                    )}
                    <span className="font-mono text-xs text-[#888888] flex items-center gap-1">
                      <Phone size={12} strokeWidth={1.5} /> {g.phone}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-[#888888] uppercase tracking-[0.5px]">
                    {g.firstVisit && (
                      <>First: {format(new Date(g.firstVisit), "MMM d, yyyy")}&nbsp;&nbsp;</>
                    )}
                    Last: {format(new Date(g.lastVisit), "MMM d, yyyy")}
                  </p>
                  {g.allergies && (
                    <p className="font-serif text-xs italic text-[#C45C4A] mt-1 flex items-center gap-1">
                      <TriangleAlert size={11} strokeWidth={1.5} /> {g.allergies}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 sm:ml-4">
                  <div className="text-right">
                    <p className="font-mono text-2xl font-bold">{g.visitCount}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[1px] text-[#888888]">
                      Visits
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(g)}
                    className="font-mono text-[10px] uppercase tracking-[1px] border border-[#E0E0E0] bg-white px-3 py-1.5 rounded-none cursor-pointer hover:bg-[#F5F5F5] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setMergeGuest(g); setMergeTargetId(""); }}
                    className="text-[#888888] hover:text-[#0D0D0D] cursor-pointer"
                    title="Merge profiles"
                  >
                    <GitMerge size={15} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setDeleteGuestTarget(g)}
                    className="text-[#888888] hover:text-[#C45C4A] cursor-pointer"
                    title="Delete guest"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Guest Modal */}
      {editGuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setEditGuest(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white border border-[#E0E0E0] rounded-none shadow-lg max-w-[460px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[2px]">
                {editGuest.firstName} {editGuest.lastName}
              </h3>
              <button
                onClick={() => setEditGuest(null)}
                className="cursor-pointer hover:opacity-60"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[1px] text-[#0D0D0D] mb-1.5 block">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[1px] text-[#0D0D0D] mb-1.5 block">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[1px] text-[#0D0D0D] mb-1.5 block">
                  Instagram
                </label>
                <input
                  type="text"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                  placeholder="@handle"
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[1px] text-[#0D0D0D] mb-1.5 block">
                  Allergies
                </label>
                <input
                  type="text"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[1px] text-[#0D0D0D] mb-1.5 block">
                  Usual Order
                </label>
                <input
                  type="text"
                  value={editForm.usualOrder}
                  onChange={(e) => setEditForm({ ...editForm, usualOrder: e.target.value })}
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>
              <Button onClick={saveEdit}>Save Profile</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setDeleteTarget(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white border border-[#E0E0E0] rounded-none shadow-lg max-w-[400px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[2px]">
                Delete Reservation
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer hover:opacity-60"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-6 pb-6">
              <p className="font-serif text-sm mb-1">
                Are you sure you want to delete the reservation for <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>?
              </p>
              <p className="font-mono text-[10px] text-[#888888] mb-3">
                {deleteTarget.date} &middot; {deleteTarget.time} &middot; Party of {deleteTarget.partySize}
              </p>
              <p className="font-mono text-[11px] text-[#888888] mb-5">
                Did you mean to cancel instead? You can change the status to &ldquo;Cancelled&rdquo; to keep the record.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 font-mono text-[11px] uppercase tracking-[2px] border border-[#E0E0E0] bg-white text-[#0D0D0D] px-5 py-3 rounded-none cursor-pointer hover:bg-[#F5F5F5] transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() => {
                    deleteReservation(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 font-mono text-[11px] uppercase tracking-[2px] bg-[#C45C4A] text-white border-none px-5 py-3 rounded-none cursor-pointer hover:bg-[#b04f3f] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Guest Confirmation Dialog */}
      {deleteGuestTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setDeleteGuestTarget(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white border border-[#E0E0E0] rounded-none shadow-lg max-w-[400px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[2px]">
                Delete Guest
              </h3>
              <button
                onClick={() => setDeleteGuestTarget(null)}
                className="cursor-pointer hover:opacity-60"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-6 pb-6">
              <p className="font-serif text-sm mb-3">
                This will permanently remove <strong>{deleteGuestTarget.firstName} {deleteGuestTarget.lastName}</strong> and all their visit history. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteGuestTarget(null)}
                  className="flex-1 font-mono text-[11px] uppercase tracking-[2px] border border-[#E0E0E0] bg-white text-[#0D0D0D] px-5 py-3 rounded-none cursor-pointer hover:bg-[#F5F5F5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteGuest(deleteGuestTarget.id);
                    setDeleteGuestTarget(null);
                  }}
                  className="flex-1 font-mono text-[11px] uppercase tracking-[2px] bg-[#C45C4A] text-white border-none px-5 py-3 rounded-none cursor-pointer hover:bg-[#b04f3f] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Guest Modal */}
      {mergeGuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setMergeGuest(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white border border-[#E0E0E0] rounded-none shadow-lg max-w-[460px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[2px]">
                Merge Profile
              </h3>
              <button
                onClick={() => setMergeGuest(null)}
                className="cursor-pointer hover:opacity-60"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-6 pb-6">
              <p className="font-serif text-sm mb-4">
                Merging <strong>{mergeGuest.firstName} {mergeGuest.lastName}</strong> into another profile. This profile will be deleted after merging.
              </p>
              <label className="font-mono text-[10px] uppercase tracking-[1px] text-[#0D0D0D] mb-1.5 block">
                Merge Into (will be kept)
              </label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full border border-[#E0E0E0] rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#0D0D0D] bg-white mb-4"
              >
                <option value="">Select a profile...</option>
                {guests
                  .filter((g) => g.id !== mergeGuest.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.firstName} {g.lastName} — {g.phone}
                    </option>
                  ))}
              </select>
              <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888] mb-4">
                Visit counts will be combined. Notes and details will be kept from both.
              </p>
              <button
                onClick={handleMerge}
                disabled={!mergeTargetId}
                className="w-full font-mono text-[11px] uppercase tracking-[2px] bg-[#888888] text-white border-none px-5 py-3 rounded-none cursor-pointer hover:bg-[#888888] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Merge &amp; Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
