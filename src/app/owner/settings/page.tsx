"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { formatTime12 } from "@/lib/formatting";
import {
  Save,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Croissant,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  PALETTES,
  FONT_PAIRINGS,
  PALETTE_IDS,
  FONT_PAIRING_IDS,
  type PaletteId,
  type FontPairingId,
} from "@/lib/theme-presets";
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
} from "date-fns";

interface DayConfig {
  open: boolean;
  start?: string;
  end?: string;
}

interface Settings {
  operatingHours: Record<string, DayConfig>;
  maxSeatingDuration: number;
  resetBuffer: number;
  maxTotalGuests: number;
  slotInterval: number;
  bookingWindowDays: number;
  autoMergeDuplicates: boolean;
  timezone: string;
  googleConnected: boolean;
  googleAccountEmail?: string;
  googleCalendarId?: string;
  colorPalette: string;
  fontPairing: string;
  restaurantName: string;
  heroHeading: string;
  heroSubtext: string;
  iconType: string;
  iconValue: string;
  navIcon: string;
  siteName: string;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
        checked ? "bg-[#0D0D0D]" : "bg-[#E0E0E0]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"branding" | "service">("service");
  const [settings, setSettings] = useState<Settings | null>(null);
  const savedSettingsRef = useRef<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const isDirty = useCallback(() => {
    if (!settings || !savedSettingsRef.current) return false;
    return JSON.stringify(settings) !== savedSettingsRef.current;
  }, [settings]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [holidayMonth, setHolidayMonth] = useState(new Date());

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const s = {
          ...data,
          restaurantName: data.restaurantName ?? "My Restaurant",
          heroHeading: data.heroHeading ?? "Reserve Your\nTable.",
          heroSubtext: data.heroSubtext ?? "Book your experience with us.",
          iconType: data.iconType ?? "emoji",
          iconValue: data.iconValue ?? "",
          navIcon: data.navIcon ?? "utensils",
          siteName: data.siteName ?? "",
          colorPalette: data.colorPalette ?? "classic",
          fontPairing: data.fontPairing ?? "serif-mono",
        };
        setSettings(s);
        savedSettingsRef.current = JSON.stringify(s);
        if (data.blockedDates) setBlockedDates(data.blockedDates);
      })
      .catch(console.error);
  }, []);

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty()) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Load Google Fonts for font pairing previews
  useEffect(() => {
    FONT_PAIRING_IDS.forEach((id) => {
      const url = FONT_PAIRINGS[id].googleFontsUrl;
      if (!url) return;
      const linkId = `font-preview-${id}`;
      if (document.getElementById(linkId)) return;
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);

    const payload: Record<string, unknown> = {
      operatingHours: settings.operatingHours,
      maxSeatingDuration: settings.maxSeatingDuration,
      resetBuffer: settings.resetBuffer,
      maxTotalGuests: settings.maxTotalGuests,
      slotInterval: settings.slotInterval,
      bookingWindowDays: settings.bookingWindowDays,
      autoMergeDuplicates: settings.autoMergeDuplicates,
      timezone: settings.timezone,
      colorPalette: settings.colorPalette,
      fontPairing: settings.fontPairing,
      restaurantName: settings.restaurantName,
      heroHeading: settings.heroHeading,
      heroSubtext: settings.heroSubtext,
      iconType: settings.iconType,
      iconValue: settings.iconValue,
      navIcon: settings.navIcon,
      siteName: settings.siteName,
    };
    if (settings.googleCalendarId) {
      payload.googleCalendarId = settings.googleCalendarId;
    }

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      window.location.reload();
    }
  }

  function handleReset() {
    if (!settings) return;
    setSettings({
      ...settings,
      operatingHours: {
        monday: { open: true, start: "11:00", end: "21:00" },
        tuesday: { open: true, start: "11:00", end: "21:00" },
        wednesday: { open: true, start: "11:00", end: "21:00" },
        thursday: { open: true, start: "11:00", end: "21:00" },
        friday: { open: true, start: "11:00", end: "22:00" },
        saturday: { open: true, start: "11:00", end: "22:00" },
        sunday: { open: false, start: "11:00", end: "21:00" },
      },
      maxSeatingDuration: 90,
      resetBuffer: 15,
      slotInterval: 15,
      bookingWindowDays: 30,
      maxTotalGuests: 20,
      colorPalette: "classic",
      fontPairing: "serif-mono",
    });
    setShowResetDialog(false);
  }

  function updateDay(day: string, field: string, value: boolean | string) {
    if (!settings) return;
    setSettings({
      ...settings,
      operatingHours: {
        ...settings.operatingHours,
        [day]: { ...settings.operatingHours[day], [field]: value },
      },
    });
  }

  async function toggleBlockedDate(dateStr: string) {
    const isBlocked = blockedDates.includes(dateStr);
    const method = isBlocked ? "DELETE" : "POST";

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blockedDate: dateStr,
        blockedDateAction: isBlocked ? "remove" : "add",
      }),
    });

    if (res.ok) {
      setBlockedDates((prev) =>
        isBlocked ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
      );
    }
  }

  if (!settings) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-sm text-[#888888]">Loading...</p>
      </div>
    );
  }

  // Holiday calendar
  const monthStart = startOfMonth(holidayMonth);
  const monthEnd = endOfMonth(holidayMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    calDays.push(d);
    d = addDays(d, 1);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-[2px] mb-1">
            Settings
          </h1>
          <p className="font-serif text-base italic">
            Configure your service and public page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="font-mono text-[10px] text-green-600 uppercase">
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowResetDialog(true)}
            className="font-mono text-[11px] uppercase tracking-[2px] border border-[#E0E0E0] bg-white text-[#0D0D0D] px-4 py-2.5 rounded-none cursor-pointer hover:bg-[#F5F5F5] transition-colors"
          >
            Reset
          </button>
          <Button
            className="!w-auto !px-5 flex items-center gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={14} strokeWidth={1.5} />
            {saving ? "..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#E0E0E0] mb-10">
        <button
          type="button"
          onClick={() => setActiveTab("service")}
          className={`font-mono text-[11px] uppercase tracking-[2px] px-5 py-3 cursor-pointer transition-colors border-b-2 -mb-px ${
            activeTab === "service"
              ? "border-[#0D0D0D] text-[#0D0D0D]"
              : "border-transparent text-[#888888] hover:text-[#0D0D0D]"
          }`}
        >
          Service
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`font-mono text-[11px] uppercase tracking-[2px] px-5 py-3 cursor-pointer transition-colors border-b-2 -mb-px ${
            activeTab === "branding"
              ? "border-[#0D0D0D] text-[#0D0D0D]"
              : "border-transparent text-[#888888] hover:text-[#0D0D0D]"
          }`}
        >
          Branding
        </button>
      </div>

      {activeTab === "branding" && (
        <>
          {/* Name & Logo */}
          <section className="mb-10">
            <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
              Name & Logo
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={settings.restaurantName}
                  onChange={(e) =>
                    setSettings({ ...settings, restaurantName: e.target.value })
                  }
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm"
                />
              </div>
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
                  Logo
                </label>
                <p className="font-mono text-[10px] text-[#888888] mb-2">
                  Upload a custom image, or the nav icon will be used. Also shown as the browser tab icon.
                </p>
                <div className="flex items-center gap-2">
                  <label className="inline-block border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-[10px] uppercase tracking-[1px] cursor-pointer hover:border-[#888888]">
                    {settings.iconValue ? "Replace Image" : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 256 * 1024) {
                          alert("Image must be under 256KB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setSettings({
                            ...settings,
                            iconType: "image",
                            iconValue: reader.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {settings.iconValue && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, iconType: "image", iconValue: "" })}
                      className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888] hover:text-[#0D0D0D] cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {settings.iconValue && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888]">
                      Preview:
                    </span>
                    <img
                      src={settings.iconValue}
                      alt="Icon preview"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
                  Nav Icon
                </label>
                <div className="flex gap-2">
                  {([["coffee", Coffee], ["croissant", Croissant], ["utensils", UtensilsCrossed]] as const).map(([id, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSettings({ ...settings, navIcon: id })}
                      className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 border rounded-none cursor-pointer ${
                        settings.navIcon === id
                          ? "border-[#0D0D0D] bg-[#0D0D0D] text-white"
                          : "border-[#E0E0E0] hover:border-[#888888]"
                      }`}
                    >
                      <Icon size={14} strokeWidth={1.5} /> {id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Site Content */}
          <section className="mb-10">
            <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
              Site Content
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
                  Public Site Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) =>
                    setSettings({ ...settings, siteName: e.target.value })
                  }
                  placeholder={settings.restaurantName || "Restaurant Reservations"}
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm"
                />
                <p className="font-mono text-[10px] text-[#888888] mt-1">
                  Shown in the browser tab. Defaults to restaurant name if empty.
                </p>
              </div>
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
                  Hero Heading
                </label>
                <textarea
                  value={settings.heroHeading}
                  onChange={(e) =>
                    setSettings({ ...settings, heroHeading: e.target.value })
                  }
                  rows={2}
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm resize-none"
                />
                <p className="font-serif text-xs italic text-[#888888] mt-1">
                  Use line breaks for multiple lines
                </p>
              </div>
              <div>
                <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
                  Hero Subtext
                </label>
                <input
                  type="text"
                  value={settings.heroSubtext}
                  onChange={(e) =>
                    setSettings({ ...settings, heroSubtext: e.target.value })
                  }
                  className="w-full border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm"
                />
              </div>
            </div>
          </section>

          {/* Theme */}
          <section className="mb-10">
            <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
              Theme
            </h2>
            <h3 className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888] mb-3">
              Color Palette
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PALETTE_IDS.map((id) => {
                const palette = PALETTES[id];
                const isSelected = settings.colorPalette === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setSettings({ ...settings, colorPalette: id })
                    }
                    className={`border rounded-none p-3 text-center cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#0D0D0D] ring-1 ring-[#0D0D0D]"
                        : "border-[#E0E0E0] hover:border-[#888888]"
                    }`}
                  >
                    <div className="flex justify-center gap-1.5 mb-2">
                      <span
                        className="w-5 h-5 rounded-full border border-[#E0E0E0]"
                        style={{ backgroundColor: palette.colors.bg }}
                      />
                      <span
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: palette.colors.textPrimary }}
                      />
                      <span
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: palette.colors.btnBg }}
                      />
                      <span
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: palette.colors.accentSoft }}
                      />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[1px]">
                      {palette.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <h3 className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888] mt-6 mb-3">
              Font Pairing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FONT_PAIRING_IDS.map((id) => {
                const fp = FONT_PAIRINGS[id];
                const isSelected = settings.fontPairing === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setSettings({ ...settings, fontPairing: id })
                    }
                    className={`border rounded-none p-4 text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#0D0D0D] ring-1 ring-[#0D0D0D]"
                        : "border-[#E0E0E0] hover:border-[#888888]"
                    }`}
                  >
                    <span
                      className="block text-lg mb-1"
                      style={{ fontFamily: fp.heading }}
                    >
                      Heading Text
                    </span>
                    <span
                      className="block text-sm text-[#888888]"
                      style={{ fontFamily: fp.body }}
                    >
                      Body text preview
                    </span>
                    <span className="block font-mono text-[10px] uppercase tracking-[1px] mt-2">
                      {fp.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Live Preview */}
          <section className="mb-10">
            <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
              Preview
            </h2>
            <div
              className="border border-[#E0E0E0] rounded-none p-6 max-w-sm"
              style={{
                backgroundColor:
                  PALETTES[settings.colorPalette as PaletteId]?.colors.bg,
                color:
                  PALETTES[settings.colorPalette as PaletteId]?.colors.textPrimary,
              }}
            >
              <p
                className="text-[11px] uppercase tracking-[2px] mb-2"
                style={{
                  fontFamily:
                    FONT_PAIRINGS[settings.fontPairing as FontPairingId]?.body,
                }}
              >
                {settings.restaurantName}
              </p>
              <p
                className="text-2xl font-bold mb-2"
                style={{
                  fontFamily:
                    FONT_PAIRINGS[settings.fontPairing as FontPairingId]?.body,
                }}
              >
                {(settings.heroHeading || "").split("\n").map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
              {settings.heroSubtext && (
                <p
                  className="text-sm italic mb-4"
                  style={{
                    fontFamily:
                      FONT_PAIRINGS[settings.fontPairing as FontPairingId]?.heading,
                    color:
                      PALETTES[settings.colorPalette as PaletteId]?.colors.textMuted,
                  }}
                >
                  {settings.heroSubtext}
                </p>
              )}
              <div
                className="inline-block px-4 py-2 text-[11px] uppercase tracking-[2px]"
                style={{
                  backgroundColor:
                    PALETTES[settings.colorPalette as PaletteId]?.colors.btnBg,
                  color:
                    PALETTES[settings.colorPalette as PaletteId]?.colors.btnText,
                  fontFamily:
                    FONT_PAIRINGS[settings.fontPairing as FontPairingId]?.body,
                }}
              >
                Reserve My Table
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "service" && (
        <>
      {/* Operating Hours */}
      <section className="mb-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
          Operating Hours
        </h2>
        <div className="border border-[#E0E0E0] rounded-none divide-y divide-[#E0E0E0]">
          {DAYS.map((day) => {
            const config = settings.operatingHours[day] || { open: false };
            return (
              <div
                key={day}
                className="flex flex-wrap sm:flex-nowrap items-center gap-x-6 gap-y-2 px-5 py-4"
              >
                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <span className="font-mono text-sm w-28 capitalize">
                    {day}
                  </span>
                  <Toggle
                    checked={config.open}
                    onChange={(val) => updateDay(day, "open", val)}
                  />
                </div>
                {config.open ? (
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="time"
                      value={config.start || "07:00"}
                      onChange={(e) =>
                        updateDay(day, "start", e.target.value)
                      }
                      className="font-mono text-sm border border-[#E0E0E0] rounded-none px-3 py-2 w-full sm:w-36"
                    />
                    <span className="font-mono text-sm text-[#888888]">
                      &ndash;
                    </span>
                    <input
                      type="time"
                      value={config.end || "10:15"}
                      onChange={(e) => updateDay(day, "end", e.target.value)}
                      className="font-mono text-sm border border-[#E0E0E0] rounded-none px-3 py-2 w-full sm:w-36"
                    />
                  </div>
                ) : (
                  <span className="font-serif text-sm italic text-[#888888]">
                    Closed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Precision Timing */}
      <section className="mb-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
          Precision Timing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
              Max Seating Duration (min)
            </label>
            <input
              type="number"
              value={settings.maxSeatingDuration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxSeatingDuration: parseInt(e.target.value) || 0,
                })
              }
              className="w-full border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm"
            />
            <p className="font-serif text-xs italic text-[#888888] mt-1">
              Default: 75 mins
            </p>
          </div>
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
              Reset Buffer (min)
            </label>
            <input
              type="number"
              value={settings.resetBuffer}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  resetBuffer: parseInt(e.target.value) || 0,
                })
              }
              className="w-full border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm"
            />
            <p className="font-serif text-xs italic text-[#888888] mt-1">
              Default: 15 mins
            </p>
          </div>
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
              Time Slot Interval (min)
            </label>
            <input
              type="number"
              value={settings.slotInterval}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  slotInterval: parseInt(e.target.value) || 15,
                })
              }
              className="w-full border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm"
            />
            <p className="font-serif text-xs italic text-[#888888] mt-1">
              How often time slots appear (e.g. every 15, 30, or 60 mins)
            </p>
          </div>
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
              Booking Window (days)
            </label>
            <input
              type="number"
              value={settings.bookingWindowDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bookingWindowDays: parseInt(e.target.value) || 30,
                })
              }
              className="w-full border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm"
            />
            <p className="font-serif text-xs italic text-[#888888] mt-1">
              How far in advance guests can book
            </p>
          </div>
        </div>
      </section>

      {/* Capacity */}
      <section className="mb-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
          Capacity
        </h2>
        <label className="font-mono text-xs font-bold uppercase tracking-[1px] block mb-2">
          Max Total Guests at Once
        </label>
        <input
          type="number"
          value={settings.maxTotalGuests}
          onChange={(e) =>
            setSettings({
              ...settings,
              maxTotalGuests: parseInt(e.target.value) || 1,
            })
          }
          className="w-64 border border-[#E0E0E0] rounded-none px-3 py-2 font-mono text-sm"
        />
      </section>

      {/* Holiday Mode */}
      <section className="mb-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
          Holiday Mode
        </h2>
        <p className="font-serif text-sm italic mb-4">
          Click a date to toggle it as closed.
        </p>
        <div className="border border-[#E0E0E0] rounded-none p-5 max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setHolidayMonth(subMonths(holidayMonth, 1))}
              className="cursor-pointer hover:opacity-60 border border-[#E0E0E0] rounded-none p-0.5"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
            <span className="font-mono text-sm">
              {format(holidayMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setHolidayMonth(addMonths(holidayMonth, 1))}
              className="cursor-pointer hover:opacity-60 border border-[#E0E0E0] rounded-none p-0.5"
            >
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span
                key={d}
                className="font-mono text-[10px] text-[#888888] pb-1"
              >
                {d}
              </span>
            ))}
            {calDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, holidayMonth);
              const today = isToday(day);
              const isBlocked = blockedDates.includes(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => inMonth && toggleBlockedDate(dateStr)}
                  className={`font-mono text-sm py-1 rounded-none cursor-pointer transition-colors ${
                    !inMonth
                      ? "text-[#888888] opacity-30"
                      : isBlocked
                      ? "bg-[#C45C4A] text-white"
                      : today
                      ? "bg-[#F5F5F5] font-bold"
                      : "hover:bg-[#F5F5F5]"
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guest Profiles */}
      <section className="mb-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
          Guest Profiles
        </h2>
        <div className="border border-[#E0E0E0] rounded-none px-5 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[1px]">
              Auto-Merge Duplicate Phone Numbers
            </p>
            <p className="font-serif text-xs italic text-[#888888] mt-1">
              When on, repeat guests with the same phone are merged
              automatically. When off, a new profile is created.
            </p>
          </div>
          <Toggle
            checked={settings.autoMergeDuplicates}
            onChange={(val) => {
              setSettings({ ...settings, autoMergeDuplicates: val });
            }}
          />
        </div>
      </section>

      {/* Google Calendar */}
      <section className="mb-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-4">
          Google Calendar
        </h2>
        {settings.googleConnected ? (
          <div className="border border-[#E0E0E0] rounded-none p-4">
            <p className="font-mono text-xs mb-2">
              Connected: {settings.googleAccountEmail}
            </p>
            <a
              href="/api/auth/google"
              className="font-mono text-[10px] text-[#C45C4A] uppercase tracking-[1px] hover:underline"
            >
              Disconnect
            </a>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="inline-block bg-[#0D0D0D] text-white font-mono text-[11px] uppercase tracking-[2px] px-6 py-3 rounded-none no-underline hover:opacity-90"
          >
            Connect Google Calendar
          </a>
        )}
      </section>
        </>
      )}

      {/* Reset to Defaults Confirmation Dialog */}
      {showResetDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowResetDialog(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white border border-[#E0E0E0] rounded-none shadow-lg max-w-[420px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[2px]">
                Reset to Defaults
              </h3>
              <button
                onClick={() => setShowResetDialog(false)}
                className="cursor-pointer hover:opacity-60"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-6 pb-6">
              <p className="font-serif text-sm mb-5">
                Reset all settings to defaults? Your current configuration will be lost.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetDialog(false)}
                  className="flex-1 font-mono text-[11px] uppercase tracking-[2px] border border-[#E0E0E0] bg-white text-[#0D0D0D] px-5 py-3 rounded-none cursor-pointer hover:bg-[#F5F5F5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 font-mono text-[11px] uppercase tracking-[2px] bg-[#C45C4A] text-white border-none px-5 py-3 rounded-none cursor-pointer hover:bg-[#b04f3f] transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
