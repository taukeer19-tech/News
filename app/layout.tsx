import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { Providers } from "./components/Providers";

const inter = Inter({ subsets: ["latin"] });

import { ThemeProvider } from "./components/ThemeProvider";

export const metadata: Metadata = {
  title: "Email Marketing Platform",
  description: "Multi-tenant newsletter management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased min-h-screen relative transition-colors duration-500`}>
        <ThemeProvider>
          <Providers>
              <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none theme-blobs">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] animate-blob"></div>
                  <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-purple-900/20 blur-[120px] animate-blob animation-delay-2000"></div>
                  <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] animate-blob animation-delay-4000"></div>
              </div>

              <div className="relative z-10 min-h-screen">
                  {children}
              </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
