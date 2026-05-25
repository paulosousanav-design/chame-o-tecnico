import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chame o Técnico",
  description: "Triagem de ordens de serviço",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}