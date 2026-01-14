import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LibraryAIDTI - News & Information",
  description: "Cổng thông tin tin tức và tài liệu học tập hiện đại",
};

import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black min-h-screen`}
      >
        <AuthProvider>
          <Navbar />
          <main className="pt-16 lg:pt-20">
            {children}
          </main>
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: '!bg-white/80 !backdrop-blur-md !border !border-gray-100 !px-6 !py-3 !rounded-full !shadow-xl !text-sm !font-semibold !text-neutral-900',
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ecfdf5',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fef2f2',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
