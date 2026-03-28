import { getCachedSettings } from "@/lib/prisma";
import {
  generateThemeStyles,
  FONT_PAIRINGS,
  type PaletteId,
  type FontPairingId,
} from "@/lib/theme-presets";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getCachedSettings();
  const paletteId = (settings?.colorPalette ?? "classic") as PaletteId;
  const fontPairingId = (settings?.fontPairing ?? "serif-mono") as FontPairingId;

  const themeStyles = generateThemeStyles(paletteId, fontPairingId);
  const fontPairing = FONT_PAIRINGS[fontPairingId] ?? FONT_PAIRINGS["serif-mono"];

  const iconValue = settings?.iconValue ?? "";
  const navIcon = (settings as Record<string, unknown>)?.navIcon as string ?? "utensils";

  const NAV_ICON_SVGS: Record<string, string> = {
    coffee: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10 2v2'/><path d='M14 2v2'/><path d='M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a2 2 0 1 1 0 4h-1'/><path d='M6 2v2'/></svg>`,
    croissant: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m4.6 13.11 5.79-3.21c1.89-1.05 4.79 1.78 3.71 3.71l-3.22 5.81C8.8 23.16.79 15.23 4.6 13.11Z'/><path d='m10.5 9.5-1-2.29C9.2 6.48 8.8 6 8 6H4.5C2.79 6 2 6.5 2 8.5a7.71 7.71 0 0 0 2 4.83'/><path d='M8 6c0-1.55.24-4-2-4-2 0-2.5 2.17-2.5 4'/><path d='m14.5 13.5 2.29 1c.73.3 1.21.7 1.21 1.5v3.5c0 1.71-.5 2.5-2.5 2.5a7.71 7.71 0 0 1-4.83-2'/><path d='M18 16c1.55 0 4-.24 4 2 0 2-2.17 2.5-4 2.5'/></svg>`,
    utensils: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8'/><path d='M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7'/><path d='m2.1 21.8 6.4-6.3'/><path d='m19 5-7 7'/></svg>`,
  };

  let faviconHref: string | null = null;
  if (iconValue) {
    faviconHref = iconValue;
  } else {
    const svg = NAV_ICON_SVGS[navIcon] ?? NAV_ICON_SVGS.utensils;
    faviconHref = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  return (
    <>
      {faviconHref && <link rel="icon" href={faviconHref} />}
      {fontPairing.googleFontsUrl && (
        <link
          href={fontPairing.googleFontsUrl}
          rel="stylesheet"
        />
      )}
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      {children}
    </>
  );
}
