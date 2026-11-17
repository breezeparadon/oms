"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, MessagesSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "./app-sidebar"
import { Notifications } from "./notifications"
import { GlobalSearch } from "./global-search"
import { UserMenu } from "./user-menu"
import { RouteGuard } from "./route-guard"
import { OmsProvider } from "./store"
import { CRM_BASE, isCrmPath } from "./crm-mode"

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
  "/only-inbox": "แชทรวมทุกช่องทาง",
  "/only-inbox/customers": "ข้อมูลลูกค้า",
  "/only-inbox/channels": "เชื่อมต่อช่องทาง",
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const crm = isCrmPath(pathname)
  return (
    <OmsProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-w-0">
            <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4 md:hidden" />
              <span className="truncate text-sm font-medium">{TITLES[pathname] ?? (isCrmPath(pathname) ? "Happy Shopping CRM" : "Happy Shopping OMS")}</span>
              <div className="ml-auto flex items-center gap-2">
                {/* Demo: switch between the full OMS + CRM and the CRM-only edition */}
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-primary/40 text-primary hover:bg-primary/5"
                  title={crm ? "เปิดเวอร์ชันเต็ม OMS + CRM" : "เปิดเดโมเวอร์ชัน CRM อย่างเดียว (/only-inbox)"}
                  render={<Link href={crm ? "/" : CRM_BASE} />}
                >
                  {crm ? <LayoutGrid /> : <MessagesSquare />}
                  <span className="hidden sm:inline">{crm ? "เวอร์ชันเต็ม OMS + CRM" : "เดโม CRM อย่างเดียว"}</span>
                </Button>
                <GlobalSearch />
                <Notifications />
                <UserMenu />
              </div>
            </header>
            <div className="flex-1 p-4 md:p-6">
              <RouteGuard>{children}</RouteGuard>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster position="top-right" richColors theme="light" />
    </OmsProvider>
  )
}
