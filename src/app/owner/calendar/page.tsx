"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isSameDay,
  parse,
} from "date-fns";
import { ChevronLeft, ChevronRight, Users, X, AlertTriangle } from "lucide-react";

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
  status: string;
  guest: {
    visitCount: number;
  };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "#DBEAFE", text: "#1E40AF" },
  ARRIVED: { bg: "#D1FAE5", text: "#065F46" },
  COMPLETED: { bg: "#E5E7EB", text: "#374151" },
  CANCELLED: { bg: "#FEE2E2", text: "#991B1B" },
  NO_SHOW: { bg: "#FFEDD5", text: "#9A3412" },
};

const LEGEND_ITEMS = [
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "ARRIVED", label: "Arrived" },
  { status: "COMPLETED", label: "Completed" },
  { status: "CANCELLED", label: "Cancelled" },
  { status: "NO_SHOW", label: "No Show" },
];

// TODO: move these two helpers to src/lib/formatting.ts — nearly identical
// versions also live in settings/page.tsx.

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Adds minutes to an "HH:mm" string, returning the result as "H:mm".
function addMinutes(time24: string, mins: number): string {
  const [h, m] = time24.split(":").map(Number);
  const totalMins = h * 60 + m + mins;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${newH}:${newM.toString().padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    fetch(`/api/reservations?date_from=${from}&date_to=${to}`)
      .then((r) => r.json())
      .then(setReservations)
      .catch(console.error);
  }, [currentMonth]);

  // Group reservations by date
  const resByDay = new Map<string, Reservation[]>();
  for (const r of reservations) {
    if (r.status !== "CANCELLED") {
      const list = resByDay.get(r.date) || [];
      list.push(r);
      resByDay.set(r.date, list);
    }
  }

  // Compute covers per day
  const coversByDay = new Map<string, number>();
  for (const [date, list] of resByDay) {
    coversByDay.set(date, list.reduce((sum, r) => sum + r.partySize, 0));
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const allWeeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    allWeeks.push(days.slice(i, i + 7));
  }
  // Drop trailing weeks that fall entirely outside the current month.
  // e.g. if a month ends on Wednesday, the Thu–Sun overflow row is omitted.
  const weeks = allWeeks.filter((week) =>
    week.some((d) => isSameMonth(d, currentMonth))
  );

  // Get reservations for selected date
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const selectedReservations = selectedDate
    ? (resByDay.get(selectedDateStr) || []).sort((a, b) => a.time.localeCompare(b.time))
    : [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-[2px] mb-1">
            Reservation Calendar
          </h1>
          <p className="font-serif text-base italic text-[#888888]">
            Click a day to see bookings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="font-mono cursor-pointer hover:opacity-60 border border-[#E0E0E0] rounded-none p-2"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <h2 className="font-mono text-sm uppercase tracking-[2px] min-w-[160px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="font-mono cursor-pointer hover:opacity-60 border border-[#E0E0E0] rounded-none p-2"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <hr className="border-[#E0E0E0] mb-6" />

      {/* Calendar Grid */}
      <div className="border border-[#E0E0E0] overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-[#E0E0E0]">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
            <div
              key={d}
              className="font-mono text-[11px] uppercase tracking-[2px] text-center text-[#888888] py-3 border-r border-[#E0E0E0] last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7 border-b border-[#E0E0E0] last:border-b-0"
          >
            {week.map((d) => {
              const dateStr = format(d, "yyyy-MM-dd");
              const inMonth = isSameMonth(d, currentMonth);
              const isPrior = d < monthStart;
              const isNext = d > monthEnd;

              // Next-month days: invisible, no borders
              if (isNext) {
                return (
                  <div key={dateStr} className="min-h-[110px]" />
                );
              }

              // Prior-month days: greyed-out empty cell
              if (isPrior) {
                return (
                  <div
                    key={dateStr}
                    className="min-h-[110px] border-r border-[#E0E0E0] last:border-r-0 bg-[#F9F9F9]"
                  />
                );
              }

              const dayReservations = resByDay.get(dateStr) || [];
              const covers = coversByDay.get(dateStr);
              const today = isToday(d);

              return (
                <button
                  key={dateStr}
                  onClick={() => dayReservations.length > 0 && setSelectedDate(d)}
                  className={`relative text-left p-2 min-h-[110px] border-r border-[#E0E0E0] last:border-r-0 transition-colors flex flex-col ${
                    dayReservations.length > 0
                      ? "cursor-pointer hover:bg-[#FAFAFA]"
                      : "cursor-default"
                  }`}
                >
                  {/* Day number and guest count */}
                  <div className="flex items-start justify-between mb-1 w-full">
                    <span
                      className={`font-mono text-sm font-bold inline-flex items-center justify-center leading-none ${
                        today
                          ? "bg-[#0D0D0D] text-white rounded-full w-7 h-7"
                          : ""
                      }`}
                    >
                      {format(d, "d")}
                    </span>
                    {covers && covers > 0 && (
                      <span className="font-mono text-[10px] text-[#888888] inline-flex items-center gap-0.5 leading-none mt-[2px]">
                        <Users size={10} strokeWidth={1.5} className="relative top-[0.5px]" />
                        {covers}
                      </span>
                    )}
                  </div>

                  {/* Reservation pills — show up to 3, then "+N more" */}
                  <div className="flex-1 w-full overflow-hidden">
                    {dayReservations.slice(0, 3).map((r) => {
                      const colors = STATUS_COLORS[r.status] || STATUS_COLORS.CONFIRMED;
                      return (
                        <div
                          key={r.id}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded-none mb-0.5 truncate"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {formatTime12(r.time)} {r.firstName} {r.lastName.charAt(0)}…
                        </div>
                      );
                    })}
                    {dayReservations.length > 3 && (
                      <p className="font-mono text-[10px] text-[#888888] mt-0.5">
                        +{dayReservations.length - 3} more
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-5">
        {LEGEND_ITEMS.map(({ status, label }) => {
          const colors = STATUS_COLORS[status];
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-[2px]"
                style={{ backgroundColor: colors.bg }}
              />
              <span className="font-mono text-[11px] text-[#888888]">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSelectedDate(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Modal */}
          <div
            className="relative bg-white border border-[#E0E0E0] rounded-none shadow-lg max-w-[560px] w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[2px]">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="cursor-pointer hover:opacity-60 border border-[#E0E0E0] rounded-full p-1"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Reservations List */}
            <div className="px-5 pb-5">
              {selectedReservations.length === 0 ? (
                <p className="font-serif italic text-[#888888] text-sm">
                  No reservations for this day.
                </p>
              ) : (
                selectedReservations.map((r, i) => (
                  <div key={r.id}>
                    {i > 0 && <hr className="border-[#E0E0E0] my-3" />}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="font-mono text-sm font-bold">
                          {r.firstName} {r.lastName}
                        </span>
                        {r.instagram && (
                          <span className="font-mono text-[11px] text-[#888888] ml-2">
                            @{r.instagram.replace(/^@/, "")}
                          </span>
                        )}
                      </div>
                      <span
                        className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-none whitespace-nowrap"
                        style={{
                          backgroundColor: (STATUS_COLORS[r.status] || STATUS_COLORS.CONFIRMED).bg,
                          color: (STATUS_COLORS[r.status] || STATUS_COLORS.CONFIRMED).text,
                        }}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-[#888888] flex items-center gap-2 mb-1 leading-none">
                      {/* TODO: read maxSeatingDuration from settings instead of hard-coding 75 min */}
                      <span>
                        {formatTime12(r.time)} — {formatTime12(addMinutes(r.time, 75))}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Users size={10} strokeWidth={1.5} className="relative top-[0.5px]" />
                        {r.partySize}
                      </span>
                    </div>
                    {r.status === "NO_SHOW" && (
                      <div className="inline-flex items-center gap-1 text-[#C45C4A] font-serif text-xs italic mt-1 leading-none">
                        <AlertTriangle size={12} strokeWidth={1.5} className="relative top-[0.5px]" />
                        No
                      </div>
                    )}
                    {r.specialNotes && (
                      <p className="font-serif text-xs italic text-[#666] mt-1">
                        &ldquo;{r.specialNotes}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
