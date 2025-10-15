import type { Metadata } from "next";

import { GrantProvider } from "@/components/grant-context";
import "./globals.css";
import { fetchGrantOpportunities } from "@/lib/grants";

export const metadata: Metadata = {
  title: "Grant Application Tracker",
  description:
    "Discover, track, and win more grants with reminders, collaboration, and calendar integrations built for small nonprofits.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "Grant Application Tracker",
    description:
      "Discover, track, and win more grants with reminders, collaboration, and calendar integrations built for small nonprofits.",
    url: "https://example.com",
    siteName: "Grant Application Tracker",
    images: [
      {
        url: "/og-cover.svg",
        width: 1200,
        height: 630,
        alt: "Grant Application Tracker"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Grant Application Tracker",
    description:
      "Discover, track, and win more grants with reminders, collaboration, and calendar integrations built for small nonprofits.",
    images: ["/og-cover.svg"]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialGrants = await fetchGrantOpportunities();

  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <GrantProvider initialGrants={initialGrants}>{children}</GrantProvider>
      </body>
    </html>
  );
}
