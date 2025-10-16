import type { Metadata } from "next";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { AuthProvider } from "@/components/auth-context";
import { GrantProvider } from "@/components/grant-context";
import "./globals.css";
import { fetchGrantOpportunities } from "@/lib/grant-data";

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
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider
          defaultColorScheme="dark"
          theme={{
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            headings: {
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              sizes: {
                h1: { fontSize: "2.75rem", fontWeight: "700" }
              }
            },
            colors: {
              midnight: [
                "#edf2ff",
                "#dbe4ff",
                "#bac8ff",
                "#91a7ff",
                "#748ffc",
                "#5c7cfa",
                "#4c6ef5",
                "#4263eb",
                "#3b5bdb",
                "#364fc7"
              ]
            },
            primaryColor: "midnight",
            primaryShade: 6
          }}
          withGlobalStyles={false}
          withNormalizeCSS={false}
        >
          <Notifications position="top-right" autoClose={4000} />
          <AuthProvider>
            <GrantProvider initialGrants={initialGrants}>{children}</GrantProvider>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
