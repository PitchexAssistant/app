// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider, GoogleOneTap } from "@clerk/nextjs";
import { Funnel_Display } from "next/font/google";
import "./globals.css";

// Configure Funnel Display as the primary font
const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
        <body className={`${funnelDisplay.variable} font-sans`} suppressHydrationWarning>
          <GoogleOneTap />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}