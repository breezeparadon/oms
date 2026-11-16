"use client"

import { usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "./app-sidebar"
import { Notifications } from "./notifications"
import { OmsProvider } from "./store"

const TITLES: Record<string, string> = {
  "/": "แดชบอร์ด",
  "/orders": "ออเดอร์ทั้งหมด",
  "/orders/merge": "รวมออเดอร์",
  "/orders/new": "สร้างออเดอร์จากแชท",
  "/fulfillment/picking": "ใบหยิบสินค้า",
  "/fulfillment/packing": "สแกนแพ็กสินค้า",
  "/inventory": "สต๊อกและ SKU",
  "/inbox": "แชทรวมทุกช่องทาง",
  "/customers": "ข้อมูลลูกค้า",
  "/returns": "คืนสินค้า/คืนเงิน",
  "/reports": "รายงาน",
  "/channels": "เชื่อมต่อช่องทาง",
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <OmsProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-w-0">
            <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
              <span className="truncate text-sm font-medium">{TITLES[pathname] ?? "Happy Shopping OMS"}</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative hidden md:block">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="ค้นหาเลขออเดอร์ / ชื่อลูกค้า / เบอร์โทร" className="w-80 pl-8" />
                </div>
                <Notifications />
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">หย</div>
              </div>
            </header>
            <div className="flex-1 p-4 md:p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster position="top-right" richColors theme="light" />
    </OmsProvider>
  )
}
