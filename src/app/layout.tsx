import type { Metadata } from "next";
import { Sen } from "next/font/google";

import "./globals.css";

const sen = Sen({
  weight: "400",
  variable: "--font-sen",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pleasant Pottery Glaze Price Calculator",
  description:
    "Price Calculator for custom galze mixing in Pleasant Pottery Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sen.variable} antialiased`}>{children}</body>
    </html>
  );
}
