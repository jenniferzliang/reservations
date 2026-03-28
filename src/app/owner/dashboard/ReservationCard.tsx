import { parse, addMinutes, format, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Users, AlertTriangle } from "lucide-react";

export interface Reservation {
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

function getSlotLabel(dateParam: string, time: string): { label: string; color: "green" | "gray" | "red" } {
  const now = new Date();
  const slotDateTime = parse(`${dateParam} ${time}`, "yyyy-MM-dd HH:mm", new Date());
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

interface ReservationCardProps {
  reservation: Reservation;
  dateParam: string;
  maxSeatingDuration: number;
  onUpdateStatus: (id: string, status: string) => void;
}

export function ReservationCard({ reservation: r, dateParam, maxSeatingDuration, onUpdateStatus }: ReservationCardProps) {
  const isSeated = r.status === "ARRIVED";
  const isNoShow = r.status === "NO_SHOW";
  const isCompleted = r.status === "COMPLETED";
  const isConfirmed = r.status === "CONFIRMED";
  const slotInfo = isConfirmed ? getSlotLabel(dateParam, r.time) : null;

  const start = parse(r.time, "HH:mm", new Date());
  const end = addMinutes(start, maxSeatingDuration);
  const timeRange = `${format(start, "h:mm a")} — ${format(end, "h:mm a")}`;

  return (
    <div
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
                : isNoShow || isCompleted
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
                : isNoShow || isCompleted
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
          {timeRange}
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
              onClick={() => onUpdateStatus(r.id, "ARRIVED")}
            >
              Check In
            </Button>
            <Button
              variant="outlined"
              className="!w-auto !py-2.5 !px-5 text-[10px]"
              onClick={() => onUpdateStatus(r.id, "NO_SHOW")}
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
              onClick={() => onUpdateStatus(r.id, "COMPLETED")}
            >
              Complete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
