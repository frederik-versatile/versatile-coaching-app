import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Versatile Coaching",
  description: "Coach and client platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
