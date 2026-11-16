"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3, Boxes, ClipboardList, Combine, LayoutDashboard, MessagesSquare, PlugZap, Plus, RotateCcw, ScanBarcode, ShoppingCart, Users,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar"
import { useOms } from "./store"
import { canOpen } from "@/lib/mock-data"

type Item = { href: string; label: string; icon: React.ComponentType; badge?: number }

export function AppSidebar() {
  const pathname = usePathname()
  const { orders, conversations, returns, me } = useOms()
  const toProcess = orders.filter((o) => o.status === "to_process").length
  const toPack = orders.filter((o) => o.status === "to_pack" && !o.claimedBy).length
  const unread = conversations.filter((c) => c.unread > 0 && c.status !== "closed").length
  const returnOpen = returns.filter((r) => r.status === "requested").length

  const groups: { label: string; items: Item[] }[] = [
    { label: "ภาพรวม", items: [{ href: "/", label: "แดชบอร์ด", icon: LayoutDashboard }] },
    {
      label: "ออเดอร์ (OMS)",
      items: [
        { href: "/orders", label: "ออเดอร์ทั้งหมด", icon: ShoppingCart, badge: toProcess },
        { href: "/orders/merge", label: "รวมออเดอร์", icon: Combine },
        { href: "/orders/new", label: "สร้างออเดอร์ (แชท)", icon: Plus },
      ],
    },
    {
      label: "คลังและจัดส่ง",
      items: [
        { href: "/fulfillment/picking", label: "ใบหยิบสินค้า", icon: ClipboardList },
        { href: "/fulfillment/packing", label: "สแกนแพ็กสินค้า", icon: ScanBarcode, badge: toPack },
        { href: "/inventory", label: "สต๊อกและ SKU", icon: Boxes },
      ],
    },
    {
      label: "ลูกค้า (CRM)",
      items: [
        { href: "/inbox", label: "แชทรวมทุกช่องทาง", icon: MessagesSquare, badge: unread },
        { href: "/customers", label: "ข้อมูลลูกค้า", icon: Users },
      ],
    },
    {
      label: "หลังการขาย / รายงาน",
      items: [
        { href: "/returns", label: "คืนสินค้า/คืนเงิน", icon: RotateCcw, badge: returnOpen },
        { href: "/reports", label: "รายงาน", icon: BarChart3 },
        { href: "/channels", label: "เชื่อมต่อช่องทาง", icon: PlugZap },
      ],
    },
  ]

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || (href !== "/orders" && pathname.startsWith(href + "/")))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center gap-1 group-data-[collapsible=icon]:flex-col">
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-sm font-black text-white">h</div>
              <div className="grid flex-1 text-left leading-none">
                <span className="text-[22px] font-extrabold tracking-tight text-[#9200ff]" style={{ fontFamily: "var(--font-sans)" }}>
                  happy
                </span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className="bg-brand-gradient px-1 py-px text-[9px] font-bold tracking-wider text-white">SHOPPING</span>
                  <span className="text-[10px] font-semibold text-[#ff2a00]">ความสุข สั่งได้</span>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger className="hidden shrink-0 text-muted-foreground md:inline-flex" title="ย่อ/ขยายเมนู" />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => ({ ...g, items: g.items.filter((it) => canOpen(me.role, it.href)) })).filter((g) => g.items.length).map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => (
                  <SidebarMenuItem key={it.href}>
                    <SidebarMenuButton isActive={isActive(it.href)} tooltip={it.label} render={<Link href={it.href} />}>
                      <it.icon />
                      <span>{it.label}</span>
                    </SidebarMenuButton>
                    {!!it.badge && (
                      <>
                        <SidebarMenuBadge className="h-5 min-w-5 rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-sm ring-2 ring-sidebar peer-hover/menu-button:text-white peer-data-active/menu-button:text-white">
                          {it.badge > 99 ? "99+" : it.badge}
                        </SidebarMenuBadge>
                        {/* collapsed (icon) mode: show a red dot on the icon */}
                        <span className="pointer-events-none absolute top-1 left-5 hidden size-2.5 rounded-full bg-rose-500 ring-2 ring-sidebar group-data-[collapsible=icon]:block" />
                      </>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-lg bg-brand-soft p-2.5 text-[11px] leading-snug text-muted-foreground group-data-[collapsible=icon]:hidden">
          <span className="font-semibold text-foreground">OMS + CRM</span> · Mockup สำหรับนำเสนอ — ข้อมูลทั้งหมดเป็นข้อมูลจำลอง
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
