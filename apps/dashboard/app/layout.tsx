import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/opentrace/query-provider";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { SmallScreenWarning } from "@/components/opentrace/small-screen-warning";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpurTrace | Embedded APM Dashboard",
  description:
    "A lightweight embedded observability console for request traces, SQL analytics, latency, and errors.",
  generator: "SpurTrace APM",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#0d0e10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${manrope.className} ${manrope.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <I18nProvider defaultLocale="en">
            <QueryProvider>
              <TooltipProvider delay={150}>
                {children}
                <SmallScreenWarning />
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </QueryProvider>
          </I18nProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
