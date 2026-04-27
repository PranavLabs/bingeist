import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";

const APP_URL = (process.env.APP_URL || 'https://www.bingeist.com').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Bingeist — Social Watchlist for Movies, TV & Anime",
    template: "%s | Bingeist",
  },
  description:
    "Track, rate, and discover movies, TV shows, and anime. Share your watchlist, post reviews, and discuss with your community on Bingeist.",
  keywords: ["movies", "tv shows", "anime", "watchlist", "social", "reviews", "bingeist"],
  authors: [{ name: "Bingeist" }],
  creator: "Bingeist",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Bingeist",
    title: "Bingeist — Social Watchlist for Movies, TV & Anime",
    description:
      "Track, rate, and discover movies, TV shows, and anime. Share your watchlist and discuss with your community.",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Bingeist — Social Watchlist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bingeist — Social Watchlist for Movies, TV & Anime",
    description:
      "Track, rate, and discover movies, TV shows, and anime with your community.",
    images: [`${APP_URL}/og-image.png`],
    creator: "@bingeist",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-gray-200 antialiased" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace" }}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pt-14">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

