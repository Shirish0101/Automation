import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StarnX Socienty Application",
  description: "Society maintenance management web application"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
