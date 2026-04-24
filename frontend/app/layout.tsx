import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeuroNova — Voice-to-Form Engine",
  description:
    "An AI-powered voice assistant that helps low-literacy farmers and rural families fill out complex agricultural subsidy and microfinance forms using natural spoken conversation.",
  keywords: ["voice form", "agri subsidy", "microfinance", "accessibility", "Vapi AI"],
  openGraph: {
    title: "NeuroNova — Voice-to-Form Engine",
    description: "Speak naturally. Let NeuroNova fill the form for you.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070612",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${dmSans.variable} ${playfair.variable} min-h-full flex flex-col antialiased`}
        style={{ background: "#070612" }}
      >
        {children}
      </body>
    </html>
  );
}
