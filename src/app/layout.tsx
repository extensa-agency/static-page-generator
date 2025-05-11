import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from '@/components/ConditionalNavbar';
import Providers from './providers';
import { Toaster } from "react-hot-toast";
// import GlobalInfoBanner from "@/components/GlobalInfoBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildSite",
  description: "Build your website in minutes",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/* <GlobalInfoBanner /> */}
          <ConditionalNavbar />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
