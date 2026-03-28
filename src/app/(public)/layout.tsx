import { prisma } from "@/lib/prisma";
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
  const settings = await prisma.settings.findFirst();
  const paletteId = (settings?.colorPalette ?? "classic") as PaletteId;
  const fontPairingId = (settings?.fontPairing ?? "serif-mono") as FontPairingId;

  const themeStyles = generateThemeStyles(paletteId, fontPairingId);
  const fontPairing = FONT_PAIRINGS[fontPairingId] ?? FONT_PAIRINGS["serif-mono"];

  const iconType = settings?.iconType ?? "emoji";
  const iconValue = settings?.iconValue ?? "";
  let faviconHref: string | null = null;
  if (iconValue) {
    if (iconType === "emoji") {
      faviconHref = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${iconValue}</text></svg>`;
    } else {
      faviconHref = iconValue;
    }
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
