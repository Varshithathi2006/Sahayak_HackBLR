import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sahayak — Voice-to-Form Engine",
  description:
    "An AI-powered voice assistant that helps low-literacy farmers and rural families fill out complex agricultural subsidy and microfinance forms using natural spoken conversation.",
  keywords: ["voice form", "agri subsidy", "microfinance", "accessibility", "Vapi AI"],
  openGraph: {
    title: "Sahayak — Voice-to-Form Engine",
    description: "Speak naturally. Let Sahayak fill the form for you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "#070612" }}>
        {children}
      </body>
    </html>
  );
}
