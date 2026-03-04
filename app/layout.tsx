import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cinanime | Watch Your Favorite Anime & Movies",
  description: "The ultimate vault for movies and anime series. Stream the latest episodes of your favorite anime directly on Movies Vault.",
  keywords: ["Movies Vault", "Anime Streaming", "Watch Movies Free", "Anime Episodes", "MoviesVault", "Streaming"],
  
  // 1. UPDATE THIS to your actual Firebase URL
  metadataBase: new URL("https://cinanime.vercel.app"), 

  openGraph: {
    title: "Cinanime",
    description: "Your cinematic treasure chest. Stream movies and anime for free.",
    url: "https://cinanime.vercel.app", 
    siteName: "Cinanime",
    images: [
      {
        url: "/og-image.jpg", // This looks in your /public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cinanime",
    description: "Stream the latest anime and movies now.",
  },

  // 2. PASTE the code from Google Search Console here
  verification: {
    google: "DLPd5hf2kSRnkec4xM7NNxX0FJKx84GjaHpelT1Z97s", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}