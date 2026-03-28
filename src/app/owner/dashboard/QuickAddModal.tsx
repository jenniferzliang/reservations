import { useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { usePhoneLookup } from "./usePhoneLookup";

interface QuickAddModalProps {
  dateParam: string;
  onClose: () => void;
  onAdded: () => void;
}

export function QuickAddModal({ dateParam, onClose, onAdded }: QuickAddModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    instagram: "",
    phone: "",
    partySize: "2",
    allergies: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { suggestion, loading: phoneLookupLoading, lookup, clear } = usePhoneLookup();

  function handlePhoneChange(value: string) {
    setForm((prev) => ({ ...prev, phone: value }));
    lookup(value);
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    setForm((prev) => ({
      ...prev,
      firstName: suggestion.firstName,
      lastName: suggestion.lastName || "",
      instagram: suggestion.instagram || "",
      allergies: suggestion.allergies || "",
    }));
  }

  function handleClose() {
    clear();
    onClose();
  }

  async function handleSubmit() {
    if (!form.firstName.trim() || !form.phone.trim() || !form.partySize) return;
    setSubmitting(true);
    const time = format(new Date(), "HH:mm");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateParam,
          time,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
          partySize: parseInt(form.partySize),
          allergies: form.allergies.trim() || undefined,
          isWalkIn: true,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetch(`/api/reservations/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ARRIVED" }),
        });
        handleClose();
        onAdded();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to add walk-in");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
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
            onClick={handleClose}
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
                value={form.phone}
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
                value={form.partySize}
                onChange={(e) => setForm({ ...form, partySize: e.target.value })}
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
          {suggestion && (
            <button
              type="button"
              onClick={acceptSuggestion}
              className="w-full text-left border border-success bg-success-bg px-4 py-3 mb-4 cursor-pointer hover:bg-success-bg transition-colors"
            >
              <p className="font-mono text-xs font-bold text-foreground">
                Welcome back, {suggestion.firstName}!
              </p>
              <p className="font-mono text-[10px] text-tertiary mt-0.5">
                {suggestion.visitCount}&times; guest
                {suggestion.instagram ? ` · @${suggestion.instagram.replace(/^@/, "")}` : ""}
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
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
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
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
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
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              className="w-full border border-border rounded-none px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-foreground"
            />
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[1px] text-secondary mb-4">
            Will be checked in immediately at {format(new Date(), "h:mm a")}.
          </p>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleClose}
              className="font-mono text-[11px] uppercase tracking-[2px] border border-border bg-white text-foreground px-5 py-3 rounded-none cursor-pointer hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.firstName.trim() || !form.phone.trim()}
              className="font-mono text-[11px] uppercase tracking-[2px] bg-foreground text-white border-none px-5 py-3 rounded-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add & Seat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
