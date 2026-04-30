import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lacrypta.dev"),
  title: {
    default: "La Crypta Dev — Explorando Bitcoin, Lightning y Nostr",
    template: "%s · La Crypta Dev",
  },
  description:
    "La Crypta Dev — investigación open source, prototipos y productos reales sobre Bitcoin, Lightning y Nostr. Infraestructura, hackatones y talleres de la comunidad La Crypta.",
  keywords: [
    "Bitcoin",
    "Lightning Network",
    "Nostr",
    "La Crypta",
    "Código abierto",
    "Argentina",
    "LaWallet",
    "Hackatón",
    "Blossom",
  ],
  authors: [{ name: "La Crypta Dev" }],
  openGraph: {
    title: "La Crypta Dev",
    description:
      "Investigación, prototipos y productos open source sobre Bitcoin, Lightning y Nostr.",
    type: "website",
    siteName: "La Crypta Dev",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "La Crypta Dev",
    description:
      "Investigación, prototipos y productos open source sobre Bitcoin, Lightning y Nostr.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
