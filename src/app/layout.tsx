import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { getCachedSettings } from "@/lib/prisma";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings();
  const name = settings?.siteName || settings?.restaurantName || "Restaurant Reservations";
  return {
    title: name,
    description: `Online reservation system for ${name}.`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={playfair.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>{children}</body>
    </html>
  );
}
