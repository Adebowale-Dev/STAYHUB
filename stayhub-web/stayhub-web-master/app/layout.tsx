import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/themeprovider";
export const metadata: Metadata = {
    title: "StayHub | Student Accommodation Platform",
    description: "A modern landing page and operations hub for student hostels, reservations, payments, and move-ins.",
    icons: {
        icon: '/favicon.ico',
    },
    manifest: '/manifest.json',
};
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        </ThemeProvider>
      </body>
    </html>);
}
