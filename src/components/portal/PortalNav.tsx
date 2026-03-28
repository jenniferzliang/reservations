"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  Croissant,
  UtensilsCrossed,
  LayoutGrid,
  Calendar,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_ICONS: Record<string, LucideIcon> = {
  coffee: Coffee,
  croissant: Croissant,
  utensils: UtensilsCrossed,
};

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/owner/dashboard", label: "Manifest", icon: LayoutGrid },
  { href: "/owner/calendar", label: "Calendar", icon: Calendar },
  { href: "/owner/guests", label: "Guests", icon: Users },
  { href: "/owner/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/owner/settings", label: "Settings", icon: Settings },
];

export function PortalNav() {
  const pathname = usePathname();
  const [branding, setBranding] = useState<{ restaurantName: string; navIcon?: string } | null>(null);

  useEffect(() => {
    fetch("/api/branding")
      .then((res) => { if (res.ok) return res.json(); })
      .then((data) => { if (data) setBranding(data); })
      .catch(console.error);
  }, []);

  const name = branding ? branding.restaurantName : null;
  const shortName = name ? name.split(/\s+/).map((w) => w[0]).join("").slice(0, 3) : null;
  const NavIcon = branding ? (NAV_ICONS[branding.navIcon ?? "utensils"] ?? UtensilsCrossed) : null;

  // Don't show nav on login page
  if (pathname === "/owner") return null;

  return (
    <nav className="border-b border-[#E0E0E0] px-4 sm:px-10 md:px-16 lg:px-24 py-3 flex items-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto">
      <Link
        href="/owner/dashboard"
        className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[#0D0D0D] no-underline mr-auto flex items-center gap-1.5 shrink-0"
      >
        {NavIcon && <NavIcon size={14} strokeWidth={1.5} />} {name && <><span className="hidden sm:inline">{name}</span><span className="sm:hidden">{shortName}</span></>}
      </Link>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`font-mono text-[10px] uppercase tracking-[1px] no-underline px-2 sm:px-3 py-1.5 rounded-none transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0 ${
              isActive
                ? "bg-[#0D0D0D] text-white"
                : "text-[#0D0D0D] hover:bg-[#F5F5F5]"
            }`}
          >
            <Icon size={13} strokeWidth={1.5} /> <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
