import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trainers Showcase",
  description: "Мини-проект для запуска 5 тренажеров без iframe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
