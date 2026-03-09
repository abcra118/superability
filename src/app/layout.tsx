import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metro Guide - Calm Transit",
  description: "A step-by-step journey planner for a calmer travel experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
