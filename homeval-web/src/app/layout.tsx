import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "HomeVal Portal",
  description: "Unified portal for property valuation and management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full">
      <body
        className={cn(
          "min-h-full flex flex-col bg-background font-sans antialiased"
        )}
      >
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="border-t py-6">
          <div className="container text-center text-muted-foreground text-sm">
            © 2026 HomeVal. All rights reserved.
          </div>
        </footer>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
