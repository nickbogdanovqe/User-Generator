import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Syne } from "next/font/google";
import { THEME_BOOTSTRAP_SCRIPT } from "@/app/ui/theme-config";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "User Generator",
  description: "Secure fresh Aurora test user provisioning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${syne.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          Stamps <html data-theme> from the persisted preference before first
          paint. The attribute is deliberately not rendered by React (`:root`
          already carries the dark tokens) so a client re-render of the root can
          never overwrite the user's choice; app/ui/theme-store.ts reconciles it
          after hydration as a further safeguard.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
