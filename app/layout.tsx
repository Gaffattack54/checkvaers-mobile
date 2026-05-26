import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/shared/sw-registrar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://checkvaers.app"),
  title: {
    default: "CheckVAERS",
    template: "%s · CheckVAERS",
  },
  description:
    "Check whether a COVID-19 adverse event matching your details has been reported to VAERS. All matching happens on your device.",
  applicationName: "CheckVAERS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CheckVAERS",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "CheckVAERS",
    description: "Private, on-device search of public VAERS reports.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#29C5F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
