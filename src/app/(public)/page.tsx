"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parse, addDays } from "date-fns";
import { SelectionCard } from "@/components/ui/SelectionCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { SlotInfo, DayAvailability } from "@/lib/availability";

interface FormData {
  firstName: string;
  lastName: string;
  instagram: string;
  phone: string;
  partySize: number;
  allergies: string;
  specialNotes: string;
}

interface Confirmation {
  id: string;
  date: string;
  time: string;
  partySize: number;
  firstName: string;
}

interface Branding {
  restaurantName: string;
  heroHeading: string;
  heroSubtext: string;
  iconType: "emoji" | "image";
  iconValue: string;
}

const ALL_PARTY_OPTIONS = [
  { value: "1", label: "1 guest" },
  { value: "2", label: "2 guests" },
  { value: "3", label: "3 guests" },
  { value: "4", label: "4 guests" },
  { value: "5", label: "5 guests" },
  { value: "6", label: "6 guests" },
  { value: "7", label: "7 guests" },
  { value: "8", label: "8 guests" },
  { value: "9", label: "8+ guests" },
];

export default function BookingPage() {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    instagram: "",
    phone: "",
    partySize: 2,
    allergies: "",
    specialNotes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [branding, setBranding] = useState<Branding>({
    restaurantName: "My Restaurant",
    heroHeading: "Reserve Your\nTable.",
    heroSubtext: "Book your experience with us.",
    iconType: "emoji",
    iconValue: "",
  });

  useEffect(() => {
    fetch("/api/availability")
      .then((res) => { if (res.ok) return res.json(); })
      .then((data) => { if (data) setAvailability(data); })
      .catch(console.error);
    fetch("/api/branding")
      .then((res) => { if (res.ok) return res.json(); })
      .then((data) => { if (data) setBranding(data); })
      .catch(console.error);
  }, []);

  const weekAvailability = useMemo(() => {
    const today = new Date();
    const days: DayAvailability[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const existing = availability.find((a) => a.date === dateStr);
      days.push(existing || { date: dateStr, dayOfWeek: format(d, "EEEE"), isOpen: false, slots: [] });
    }
    return days;
  }, [availability]);

  const selectedDaySlots = useMemo(() => {
    const slots = availability.find((d) => d.date === selectedDate)?.slots || [];
    const today = format(new Date(), "yyyy-MM-dd");
    if (selectedDate !== today) return slots;
    const now = new Date();
    const currentHHMM = format(now, "HH:mm");
    return slots.filter((s) => s.time > currentHHMM);
  }, [availability, selectedDate]);

  const partyOptions = useMemo(() => {
    if (!selectedTime || !selectedDate) return ALL_PARTY_OPTIONS;
    const slot = selectedDaySlots.find((s) => s.time === selectedTime);
    if (!slot) return ALL_PARTY_OPTIONS;
    const remaining = slot.maxCapacity - slot.currentGuests;
    if (remaining >= 9) return ALL_PARTY_OPTIONS;
    return ALL_PARTY_OPTIONS.filter((o) => parseInt(o.value) <= remaining);
  }, [selectedTime, selectedDate, selectedDaySlots]);

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    // Reset party size if it exceeds remaining capacity for this slot
    const slot = selectedDaySlots.find((s) => s.time === time);
    if (slot) {
      const remaining = slot.maxCapacity - slot.currentGuests;
      if (formData.partySize > remaining && remaining > 0) {
        setFormData((prev) => ({ ...prev, partySize: remaining }));
      }
    }
  }

  function updateField(field: keyof FormData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Required";
    if (!formData.lastName.trim()) newErrors.lastName = "Required";
    if (!formData.phone.trim()) newErrors.phone = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || "Something went wrong");
        return;
      }

      const data = await res.json();
      setConfirmation(data);
    } catch {
      setSubmitError("Failed to submit reservation");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    const dateObj = parse(confirmation.date, "yyyy-MM-dd", new Date());
    const timeObj = parse(confirmation.time, "HH:mm", new Date());

    return (
      <main className="max-w-[600px] mx-auto px-6 py-32 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted mb-4">
          {branding.restaurantName}
        </p>
        <h2 className="font-mono text-3xl font-bold mb-4">
          You&apos;re confirmed.
        </h2>
        <p className="font-serif text-base italic text-muted mb-10">
          We&apos;ll have a seat ready for you, {confirmation.firstName}.
        </p>
        <div className="border border-border mx-auto max-w-[340px]">
          <div className="flex justify-between items-center px-6 py-4 border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-[1px] text-muted">Date</span>
            <span className="font-mono text-sm font-semibold">{format(dateObj, "EEEE, MMMM d")}</span>
          </div>
          <div className="flex justify-between items-center px-6 py-4 border-b border-border">
            <span className="font-mono text-[10px] uppercase tracking-[1px] text-muted">Time</span>
            <span className="font-mono text-sm font-semibold">{format(timeObj, "h:mm a")}</span>
          </div>
          <div className="flex justify-between items-center px-6 py-4">
            <span className="font-mono text-[10px] uppercase tracking-[1px] text-muted">Party</span>
            <span className="font-mono text-sm font-semibold">
              {confirmation.partySize >= 9 ? "8+" : confirmation.partySize} {confirmation.partySize === 1 ? "guest" : "guests"}
            </span>
          </div>
        </div>
        <button
          className="mt-10 font-mono text-[10px] uppercase tracking-[2px] underline underline-offset-4 text-foreground hover:text-muted transition-colors cursor-pointer bg-transparent border-none"
          onClick={() => {
            setConfirmation(null);
            setSelectedDate(null);
            setSelectedTime(null);
            setFormData({ firstName: "", lastName: "", instagram: "", phone: "", partySize: 2, allergies: "", specialNotes: "" });
            // Hard refresh availability to reflect updated capacity
            fetch("/api/availability")
              .then((res) => res.json())
              .then(setAvailability)
              .catch(console.error);
          }}
        >
          Make Another Reservation
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-[600px] mx-auto px-6 py-16">
      {/* Hero */}
      <header className="mb-12">
        <p className="font-mono text-[11px] uppercase tracking-[2px] mb-6">
          {branding.restaurantName}
        </p>
        <h1 className="font-mono text-4xl font-bold leading-tight mb-4">
          {branding.heroHeading.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>
        {branding.heroSubtext && (
          <p className="font-serif text-base italic text-foreground">
            {branding.heroSubtext}
          </p>
        )}
        <hr className="border-border mt-8" />
      </header>

      {/* Step 01 — Choose a Day */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[1px]">
            01 &mdash; Choose a Day
          </p>
          {weekAvailability.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-[1px] text-muted">
              {format(parse(weekAvailability[0].date, "yyyy-MM-dd", new Date()), "MMM d")} &ndash; {format(parse(weekAvailability[6].date, "yyyy-MM-dd", new Date()), "MMM d")}
            </span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:overflow-x-visible sm:pb-0">
          {weekAvailability.map((day) => {
            const dateObj = parse(day.date, "yyyy-MM-dd", new Date());
            const allFull = !day.isOpen || day.slots.every((s) => s.isFull);
            return (
              <SelectionCard
                key={day.date}
                selected={selectedDate === day.date}
                disabled={allFull}
                onClick={() => !allFull && handleDateSelect(day.date)}
                className="min-w-[72px] flex-shrink-0 sm:min-w-0"
              >
                <span className="block font-mono text-[10px] uppercase tracking-[1px]">
                  {format(dateObj, "EEE")}
                </span>
                <span className="block font-mono text-[28px] font-bold leading-tight">
                  {format(dateObj, "d")}
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-[1px]">
                  {format(dateObj, "MMM")}
                </span>
              </SelectionCard>
            );
          })}
        </div>
      </section>

      {/* Step 02 — Choose Your Time */}
      {selectedDate && (
        <section className="mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[1px] mb-4">
            02 &mdash; Choose Your Time
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {selectedDaySlots.filter((slot) => !slot.isFull).map((slot) => {
              const timeObj = parse(slot.time, "HH:mm", new Date());
              return (
                <SelectionCard
                  key={slot.time}
                  selected={selectedTime === slot.time}
                  onClick={() => handleTimeSelect(slot.time)}
                >
                  <span className="font-mono text-xs tracking-[0.5px]">
                    {format(timeObj, "h:mm a")}
                  </span>
                </SelectionCard>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 03 — Tell Us About You */}
      {selectedTime && (
        <form onSubmit={handleSubmit}>
          <section className="mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[1px] mb-4">
              03 &mdash; Tell Us About You
            </p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  error={errors.firstName}
                />
                <Input
                  label="Last Name"
                  required
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  error={errors.lastName}
                />
              </div>
              <Input
                label="Instagram"
                placeholder="@yourhandle"
                value={formData.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  required
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  error={errors.phone}
                />
                <Select
                  label="Party Size"
                  required
                  options={partyOptions}
                  value={String(formData.partySize)}
                  onChange={(e) =>
                    updateField("partySize", parseInt(e.target.value))
                  }
                />
              </div>
              <Input
                label="Allergies"
                placeholder="Any food allergies?"
                value={formData.allergies}
                onChange={(e) => updateField("allergies", e.target.value)}
              />
              <Textarea
                label="Special Notes"
                placeholder="Celebrating something? A favourite flavour? We love a good story."
                value={formData.specialNotes}
                onChange={(e) => updateField("specialNotes", e.target.value)}
              />
            </div>
          </section>

          {submitError && (
            <p className="font-mono text-[10px] text-error uppercase tracking-[0.5px] mb-4 text-center">
              {submitError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Reserving..." : "Reserve My Table"}
          </Button>
        </form>
      )}
    </main>
  );
}
