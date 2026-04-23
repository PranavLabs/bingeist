import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Bingeist — Social Watchlist",
  description: "Track, share, and discover movies, TV shows, and anime with your community.",
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
