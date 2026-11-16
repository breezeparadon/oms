import type { Metadata } from "next"
import { IBM_Plex_Sans_Thai, Geist_Mono } from "next/font/google"
import { AppShell } from "@/components/oms/app-shell"
import "./globals.css"

const sans = IBM_Plex_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
})

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Happy Shopping OMS + CRM (Mockup)",
  description: "ระบบจัดการออเดอร์และแชทลูกค้ารวมทุกช่องทาง Shopee, Lazada, TikTok Shop, LINE OA, Facebook, Instagram",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
