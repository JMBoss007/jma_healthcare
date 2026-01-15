import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme.provider";

// Load the font without using `variable` to avoid hydration mismatch
const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "JMAX Technical Services",
  description: "An Auto Repair and Software Related Platform",
  icons: {
    icon: "/assets/icons/logo.png",
  },
} as Metadata; // use 'as Metadata' to keep type safety without parser errors

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-dark-300 font-sans antialiased",
          fontSans.className // use .className instead of .variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
