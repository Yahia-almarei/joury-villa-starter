import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/seo/structured-data";
import { defaultMetadata } from "@/lib/metadata";
import { ConditionalHeader } from "@/components/ConditionalHeader";

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <OrganizationStructuredData />
          <WebsiteStructuredData />
          <div className="relative flex min-h-screen flex-col">
            <ConditionalHeader />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
