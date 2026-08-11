import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Komal Kalra | Vedic Astrology",
  description: "Navigate Your Life's Journey with Cosmic Clarity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-[#FAFAF9] text-[#0F172A] font-sans`}
      >
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-[#FAFAF9]/60 border-b border-gray-200">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="text-xl font-serif font-bold text-[#F99C23]">Komal Kalra</div>
              <nav className="hidden md:flex gap-6">
                <a href="#about" className="text-sm font-medium hover:text-[#F99C23] transition-colors">About</a>
                <a href="#services" className="text-sm font-medium hover:text-[#F99C23] transition-colors">Services</a>
                <a href="/login" className="text-sm font-medium hover:text-[#F99C23] transition-colors">Login</a>
                <a href="/book" className="text-sm font-medium bg-[#F99C23] text-white px-4 py-2 rounded-full hover:bg-[#e0891d] transition-colors">Book Now</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-[#0F172A] text-white py-12 mt-auto">
            <div className="container mx-auto px-4 text-center">
              <p className="text-gray-400">&copy; {new Date().getFullYear()} Komal Kalra Astrology. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
