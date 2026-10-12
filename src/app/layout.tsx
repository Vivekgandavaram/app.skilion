import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/client-ui";
import { env } from "@/lib/env";
import { SITE, jsonLd, orgLd } from "@/lib/seo";
import BrandIntro from "@/components/BrandIntro";
import PageNavigationControls from "@/components/PageNavigationControls";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: `${SITE.name}: Teams built on proof of work`, template: "%s | Skilion" },
  description: SITE.description,
  applicationName: "Skilion",
  openGraph: { siteName: "Skilion", type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { themeColor: "#080B10", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(orgLd())} />
      </head>
      <body>
        <noscript><style>{".intro{display:none!important}"}</style></noscript>
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('sk_intro_seen')==='1')document.documentElement.classList.add('sk-seen')}catch(e){}" }} />
        <BrandIntro />
        <ToastProvider>
          {children}
          <PageNavigationControls />
        </ToastProvider>
      </body>
    </html>
  );
}
