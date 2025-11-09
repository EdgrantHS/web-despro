import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { LoadingProvider } from "@/contexts/LoadingContext";
import GlobalLoadingOverlay from "@/components/GlobalLoadingOverlay";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Despro System - Supply Chain Management",
  description: "Supply chain management system with CRUD operations",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
            <GlobalLoadingOverlay />
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col items-center">
                <AuthenticatedLayout key="auth-layout">
                  {children}
                </AuthenticatedLayout>

                {/* <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
                  <p>
                    Powered by{" "}
                    <a
                      href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                      target="_blank"
                      className="font-bold hover:underline"
                      rel="noreferrer"
                    >
                      Supabase
                    </a>
                  </p>
                  <ThemeSwitcher />
                </footer> */}
              </div>
            </main>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
