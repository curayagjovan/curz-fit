import type { Metadata, Viewport } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import "./globals.css";
import Providers from "./providers";
import DevModeBanner from "@/app/components/dev-mode-banner";
import { isDevDeployment } from "@/lib/env";

export const metadata: Metadata = {
  title: isDevDeployment ? "CURZ FIT (Dev)" : "CURZ FIT",
  description:
    "CURZ FIT workout tracking app built with Next.js, Prisma, and Supabase.",
  applicationName: isDevDeployment ? "CURZ FIT (Dev)" : "CURZ FIT",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: isDevDeployment ? "CURZ FIT (Dev)" : "CURZ FIT",
  },
  icons: {
    icon: [
      {
        url: "/pwa-icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript defaultMode="system" attribute="data" />
        <DevModeBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
