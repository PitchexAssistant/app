// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local"; // 1. Import localFont
import "./globals.css";

// 2. Configure a system font fallback instead of Google Fonts
// Using CSS variable for better flexibility and offline builds
const geistSans = {
  variable: "--font-geist-sans",
};

// 3. Configure the local heading font (Uber Move)
const uberMove = localFont({
  src: [
    {
      path: './fonts/UberMoveMedium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/UberMoveBold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: "--font-uber-move", // Create a CSS variable for it
});

export const metadata: Metadata = {
  title: "Pitchex",
  description: "Turn Ideas into Winning Pitches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        {/* 4. Combine the font variables in the body className */}
        <body className={`${geistSans.variable} ${uberMove.variable} font-sans`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}