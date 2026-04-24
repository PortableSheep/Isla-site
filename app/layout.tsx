import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { SkipToMainLink } from "@/components/SkipToMainLink";

export const metadata: Metadata = {
  title: "Isla Zone — A private message wall for families",
  description: "A private, warm, and playful message wall where families share thoughts, memories, and everyday moments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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

