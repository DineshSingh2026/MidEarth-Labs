import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Inter_Tight } from "next/font/google";
import { NO_FLASH_SCRIPT } from "@/components/themeScript";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-archivo",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter-tight",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

const BRAND = "MidEarth Labs";
const TITLE = `${BRAND}: build your own team of autonomous AI agents`;
const DESCRIPTION =
  "Connect your agents, use your preferred infrastructure and AI models, and let them collaborate and automate tasks, all from one powerful chat experience.";

// Absolute URLs for the OG card. Point NEXT_PUBLIC_SITE_URL at the real host
// on deploy; the fallback only keeps local builds from emitting relative ones.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://midearthlabs.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: BRAND,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    siteName: BRAND,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  // Dark is the default and the unset state; the switch rewrites this tag when
  // the viewer picks light, so the browser chrome tracks the page.
  themeColor: "#06070A",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${interTight.variable} ${plexMono.variable}`}
    >
      <head>
        {/*
          Applies a stored light theme before first paint. Without it the page
          paints dark and then flips, which is worse than either theme.
        */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
