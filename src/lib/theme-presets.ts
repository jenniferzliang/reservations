export type PaletteId = "classic" | "warm" | "ocean" | "midnight" | "sage";
export type FontPairingId = "serif-mono" | "sans-serif" | "mono-sans" | "elegant";

export interface PaletteColors {
  bg: string;
  textPrimary: string;
  textMuted: string;
  border: string;
  selectedBg: string;
  selectedText: string;
  accentSoft: string;
  btnBg: string;
  btnText: string;
  hoverBg: string;
  error: string;
}

export interface Palette {
  label: string;
  colors: PaletteColors;
}

export interface FontPairing {
  label: string;
  heading: string;
  body: string;
  googleFontsUrl: string | null;
}

export const PALETTES: Record<PaletteId, Palette> = {
  classic: {
    label: "Classic",
    colors: {
      bg: "#FFFFFF",
      textPrimary: "#0D0D0D",
      textMuted: "#AAAAAA",
      border: "#E0E0E0",
      selectedBg: "#0D0D0D",
      selectedText: "#FFFFFF",
      accentSoft: "#FDE8E8",
      btnBg: "#0D0D0D",
      btnText: "#FFFFFF",
      hoverBg: "#F5F5F5",
      error: "#C45C4A",
    },
  },
  warm: {
    label: "Warm",
    colors: {
      bg: "#FFF8F0",
      textPrimary: "#3D2B1F",
      textMuted: "#A0887A",
      border: "#D4C4B0",
      selectedBg: "#5C3D2E",
      selectedText: "#FFF8F0",
      accentSoft: "#F5E6D3",
      btnBg: "#5C3D2E",
      btnText: "#FFF8F0",
      hoverBg: "#F2EAE0",
      error: "#B85C38",
    },
  },
  ocean: {
    label: "Ocean",
    colors: {
      bg: "#F0F7FA",
      textPrimary: "#1A3A4A",
      textMuted: "#7A9CAF",
      border: "#C5D9E3",
      selectedBg: "#1A3A4A",
      selectedText: "#F0F7FA",
      accentSoft: "#D6EBF2",
      btnBg: "#1A3A4A",
      btnText: "#F0F7FA",
      hoverBg: "#E3EFF5",
      error: "#C45C4A",
    },
  },
  midnight: {
    label: "Midnight",
    colors: {
      bg: "#0D0D0D",
      textPrimary: "#F5F5F5",
      textMuted: "#888888",
      border: "#333333",
      selectedBg: "#F5F5F5",
      selectedText: "#0D0D0D",
      accentSoft: "#1A1A2E",
      btnBg: "#F5F5F5",
      btnText: "#0D0D0D",
      hoverBg: "#1A1A1A",
      error: "#FF6B6B",
    },
  },
  sage: {
    label: "Sage",
    colors: {
      bg: "#F5F7F2",
      textPrimary: "#2D3B2D",
      textMuted: "#7A8A7A",
      border: "#C5D1C0",
      selectedBg: "#3D5A3D",
      selectedText: "#F5F7F2",
      accentSoft: "#E3EDDE",
      btnBg: "#3D5A3D",
      btnText: "#F5F7F2",
      hoverBg: "#E8EDE5",
      error: "#B85C38",
    },
  },
};

export const FONT_PAIRINGS: Record<FontPairingId, FontPairing> = {
  "serif-mono": {
    label: "Classic Serif + Mono",
    heading: "'Playfair Display', Georgia, serif",
    body: "'Courier New', Courier, monospace",
    googleFontsUrl: null, // Already loaded by default
  },
  "sans-serif": {
    label: "Modern Sans + Serif",
    heading: "'Inter', sans-serif",
    body: "'Lora', Georgia, serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;1,400&display=swap",
  },
  "mono-sans": {
    label: "Mono + Sans",
    heading: "'JetBrains Mono', monospace",
    body: "'Work Sans', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Work+Sans:wght@300;400;500&display=swap",
  },
  elegant: {
    label: "Elegant Serif",
    heading: "'Cormorant Garamond', serif",
    body: "'Source Sans 3', sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Source+Sans+3:wght@300;400;500&display=swap",
  },
};

export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];
export const FONT_PAIRING_IDS = Object.keys(FONT_PAIRINGS) as FontPairingId[];

export function generateThemeStyles(
  paletteId: PaletteId,
  fontPairingId: FontPairingId
): string {
  const palette = PALETTES[paletteId] ?? PALETTES.classic;
  const fonts = FONT_PAIRINGS[fontPairingId] ?? FONT_PAIRINGS["serif-mono"];
  const c = palette.colors;

  return `:root {
  --color-bg: ${c.bg};
  --color-text-primary: ${c.textPrimary};
  --color-text-muted: ${c.textMuted};
  --color-border: ${c.border};
  --color-selected-bg: ${c.selectedBg};
  --color-selected-text: ${c.selectedText};
  --color-accent-soft: ${c.accentSoft};
  --color-btn-bg: ${c.btnBg};
  --color-btn-text: ${c.btnText};
  --color-hover-bg: ${c.hoverBg};
  --color-error: ${c.error};
  --font-heading: ${fonts.heading};
  --font-body: ${fonts.body};
}
body {
  font-family: ${fonts.body};
}`;
}
