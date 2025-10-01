// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider, GoogleOneTap } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import localFont from "next/font/local"; // 1. Import localFont
import "./globals.css";

// 2. Configure the default sans-serif font (Geist)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en" className="dark">
        {/* 4. Combine the font variables in the body className */}
        <body className={`${geistSans.variable} ${uberMove.variable} font-sans`}>
          <GoogleOneTap />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}