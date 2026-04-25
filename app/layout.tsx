import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { SkipToMainLink } from "@/components/SkipToMainLink";

export const metadata: Metadata = {
  title: "Isla Zone — A private message wall for families",
  description: "A private, warm, and playful message wall where families share thoughts, memories, and everyday moments.",
  applicationName: "Isla",
  appleWebApp: {
    capable: true,
    title: "Isla",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#0b0b14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased" style={{ colorScheme: 'dark' }}>
      <head>
        <meta httpEquiv="x-ua-compatible" content="IE=edge" />
      </head>
      <body className="min-h-full flex flex-col text-slate-100 selection:bg-fuchsia-500/40 selection:text-white">
        <SkipToMainLink />
        <AuthProvider>
          <main id="main-content" role="main" className="flex flex-col flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

