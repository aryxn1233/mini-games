import type { Metadata } from "next";
import { Bungee, Fredoka } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const bungee = Bungee({
  weight: "400",
  variable: "--font-bungee",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Awesome Mini Games Party!",
  description: "Play classic games with friends in real-time!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${bungee.variable} ${fredoka.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
