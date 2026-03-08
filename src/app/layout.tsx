import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Import Management System",
  description: "Aplikacija za upravljanje uvozom robe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body>{children}</body>
    </html>
  );
}