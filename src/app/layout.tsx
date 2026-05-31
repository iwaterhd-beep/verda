import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Verda — El sistema operativo para clubes cannábicos",
    template: "%s · Verda",
  },
  description:
    "Plataforma SaaS premium para la gestión de clubes cannábicos: socios, accesos, inventario, TPV, reservas, comunicación y cumplimiento legal (RGPD).",
  keywords: [
    "club cannábico",
    "asociación cannábica",
    "gestión de socios",
    "software club cannabis",
    "TPV cannabis",
    "control de acceso QR",
    "RGPD",
    "SaaS",
  ],
  authors: [{ name: "Verda" }],
  openGraph: {
    title: "Verda — El sistema operativo para clubes cannábicos",
    description:
      "Gestiona tu club cannábico con una plataforma SaaS moderna, segura y escalable.",
    type: "website",
    locale: "es_ES",
    url: appUrl,
    siteName: "Verda",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verda",
    description: "El sistema operativo para clubes cannábicos.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0f0d" },
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
