import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { SkipToMainLink } from "@/components/SkipToMainLink";

export const metadata: Metadata = {
  title: "Isla.site - Message Wall for Children",
  description: "A private message wall designed for children to share thoughts and memories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased bg-gray-950"
    >
      <head>
        {/* Accessibility: Skip to main content */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="x-ua-compatible" content="IE=edge" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        {/* Skip to main content link for keyboard users */}
        <SkipToMainLink />
        
        <AuthProvider>
          <main id="main-content" role="main">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
