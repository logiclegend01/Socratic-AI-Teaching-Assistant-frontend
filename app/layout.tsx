
import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import Providers from "./providers";
import PrivateRoute from "./(auth)/private/page";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Digital Socratic",
  description: "AI Teaching Assistant",
  icons: {
    icon: "/assets/logo.webp",
    apple: "/assets/logo.webp",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
      cz-shortcut-listen="true"
    >
      <body>
        <Providers>
          <ThemeProvider>
            <PrivateRoute>{children}</PrivateRoute>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
