"use client"

import Link from "next/link"
import { AlertTriangle, Banknote, Clock, MessagesSquare, PackageOpen, ShoppingCart, Truck } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Kpi, PageHeader, PlatformBadge, PlatformDot, ProductThumb } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { DAY, NOW, PLATFORMS, PLATFORM_IDS, STATUSES, customerById, messagePreview, orderTotal, type OrderStatus } from "@/lib/mock-data"
import { ago, baht, dayKey, dueIn, num, shortDay } from "@/lib/format"

const chartConfig = Object.fromEntries(PLATFORM_IDS.map((p) => [p, { label: PLATFORMS[p].name, color: PLATFORMS[p].color }])) as ChartConfig

export default function DashboardPage() {
  const { orders, products, conversations, reserved, customers } = useOms()
  const todayKey = dayKey(NOW)
  const today = orders.filter((o) => dayKey(o.createdAt) === todayKey && o.status !== "cancelled")
  const revenueToday = today.reduce((s, o) => s + orderTotal(o), 0)
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length
  const overdue = orders.filter((o) => ["to_process", "to_pack"].includes(o.status) && dueIn(o.shipBy).urgent)
  const lowStock = products.filter((p) => p.price > 0 && p.stock.bkk + p.stock.cnx - reserved(p.sku) <= p.safety)
  const unread = conversations.filter((c) => c.unread > 0 && c.status !== "closed")
  const riskOrders = orders.filter((o) => o.status === "to_process" && o.payment === "cod" && customers.find((c) => c.id === o.customerId)?.blacklisted)

  const days = Array.from({ length: 14 }, (_, i) => NOW - (13 - i) * DAY)
  const series = days.map((d) => {
    const k = dayKey(d)
    const row: Record<string, number | string> = { day: shortDay(d) }
    for (const p of PLATFORM_IDS) row[p] = orders.filter((o) => o.platform === p && dayKey(o.createdAt) === k && o.status !== "cancelled").reduce((s, o) => s + orderTotal(o), 0)
    return row
  })

  const byPlatform = PLATFORM_IDS.map((p) => {
    const list = orders.filter((o) => o.platform === p && o.createdAt > NOW - 30 * DAY && o.status !== "cancelled")
    return { p, orders: list.length, revenue: list.reduce((s, o) => s + orderTotal(o), 0), pending: orders.filter((o) => o.platform === p && o.status === "to_process").length }
  })
  const totalRev30 = byPlatform.reduce((s, r) => s + r.revenue, 0)

  const pipeline: OrderStatus[] = ["unpaid", "to_process", "to_pack", "to_ship", "shipping"]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-brand-soft p-5 ring-1 ring-primary/10">
        <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
      <PageHeader
        title="สวัสดี แอดมินหยก 👋"
        description="ภาพรวมออเดอร์และแชทจาก 6 ช่องทาง — อัปเดตล่าสุด 1 นาทีที่แล้ว"
        actions={
          <>
            <Button variant="outline" render={<Link href="/inbox" />}>
              <MessagesSquare /> แชทค้างตอบ {unread.length}
            </Button>
            <Button render={<Link href="/orders?status=to_process" />}>
              <ShoppingCart /> จัดการออเดอร์
            </Button>
          </>
        }
      />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="ออเดอร์วันนี้" value={num(today.length)} hint={`จาก ${PLATFORM_IDS.length} ช่องทาง`} icon={<ShoppingCart />} />
        <Kpi label="ยอดขายวันนี้" value={baht(revenueToday)} hint="ไม่รวมออเดอร์ที่ยกเลิก" icon={<Banknote />} tone="good" />
        <Kpi label="รอจัดการ" value={num(count("to_process"))} hint={`${overdue.length} ออเดอร์ใกล้/เลยกำหนดส่ง`} icon={<Clock />} tone="warn" />
        <Kpi label="แชทยังไม่ได้ตอบ" value={num(unread.length)} hint={`${conversations.filter((c) => !c.assignee && c.status !== "closed").length} แชทยังไม่มีผู้รับผิดชอบ`} icon={<MessagesSquare />} tone="danger" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สถานะออเดอร์ (Pipeline)</CardTitle>
          <CardDescription>สถานะจากทุกแพลตฟอร์มถูกแปลงเป็นมาตรฐานเดียวกัน — คลิกเพื่อดูรายการ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {pipeline.map((s, i) => (
              <Link key={s} href={`/orders?status=${s}`} className="group relative rounded-xl border p-3 transition hover:border-primary hover:bg-muted/50">
                <div className="text-xs text-muted-foreground">
                  {i + 1}. {STATUSES[s].label}
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{num(count(s))}</div>
                <div className="mt-2 flex gap-1">
                  {PLATFORM_IDS.map((p) => {
                    const n = orders.filter((o) => o.status === s && o.platform === p).length
                    return n ? (
                      <span key={p} className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <PlatformDot platform={p} className="size-3.5 text-[6px]" />
                        {n}
                      </span>
                    ) : null
                  })}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ยอดขายรายวันแยกช่องทาง (14 วัน)</CardTitle>
            <CardDescription>รวม 30 วัน {baht(totalRev30)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
              <BarChart data={series} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {PLATFORM_IDS.map((p, i) => (
                  <Bar key={p} dataKey={p} stackId="a" fill={`var(--color-${p})`} radius={i === PLATFORM_IDS.length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนช่องทาง (30 วัน)</CardTitle>
            <CardDescription>ยอดขาย / ออเดอร์ / รอจัดการ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {byPlatform
              .sort((a, b) => b.revenue - a.revenue)
              .map((r) => (
                <div key={r.p} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <PlatformBadge platform={r.p} />
                    <span className="tabular-nums">{baht(r.revenue)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(r.revenue / totalRev30) * 100}%`, backgroundColor: PLATFORMS[r.p].color }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{num(r.orders)} ออเดอร์</span>
                    <span>รอจัดการ {r.pending}</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-500" /> แจ้งเตือนความเสี่ยง
            </CardTitle>
            <CardDescription>ออเดอร์ผิดปกติ / ลูกค้าบัญชีดำ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {riskOrders.map((o) => (
              <div key={o.id} className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 dark:border-rose-900 dark:bg-rose-950/40">
                <div className="font-medium">{o.id} · COD {baht(orderTotal(o))}</div>
                <div className="text-xs text-muted-foreground">
                  {customerById(o.customerId).name} — {customers.find((c) => c.id === o.customerId)?.note}
                </div>
              </div>
            ))}
            {overdue.slice(0, 4).map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <PlatformDot platform={o.platform} />
                  <span className="font-medium">{o.id}</span>
                </div>
                <span className="text-xs text-rose-600 dark:text-rose-400">{dueIn(o.shipBy).text}</span>
              </div>
            ))}
            {overdue.length > 4 && <div className="text-xs text-muted-foreground">และอีก {overdue.length - 4} ออเดอร์ใกล้ครบกำหนดส่ง</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageOpen className="size-4 text-amber-500" /> สต๊อกใกล้หมด
            </CardTitle>
            <CardDescription>คงเหลือพร้อมขาย ≤ จุดสั่งซื้อซ้ำ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lowStock.map((p) => {
              const avail = p.stock.bkk + p.stock.cnx - reserved(p.sku)
              return (
                <div key={p.sku} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                  <ProductThumb sku={p.sku} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
                  </div>
                  <span className={avail <= 0 ? "font-semibold text-rose-600" : "font-semibold text-amber-600"}>{avail <= 0 ? "หมด" : `เหลือ ${avail}`}</span>
                </div>
              )
            })}
            <Button variant="outline" size="sm" className="w-full" render={<Link href="/inventory" />}>
              ไปหน้าสต๊อก
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessagesSquare className="size-4 text-sky-500" /> แชทล่าสุด
            </CardTitle>
            <CardDescription>รวมจากทุกช่องทางในกล่องเดียว</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {unread.slice(0, 6).map((c) => {
              const last = c.messages[c.messages.length - 1]
              return (
                <Link key={c.id} href={`/inbox?c=${c.id}`} className="flex items-start gap-2 rounded-lg p-2 hover:bg-muted">
                  <PlatformDot platform={c.platform} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="truncate font-medium">{customerById(c.customerId).name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{ago(last.at)}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{messagePreview(last)}</div>
                  </div>
                  <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{c.unread}</span>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="size-4" /> รอขนส่งเข้ารับวันนี้
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {[...new Set(orders.filter((o) => o.status === "to_ship").map((o) => o.carrier))].map((c) => (
            <div key={c} className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{c}</div>
              <div className="text-lg font-semibold">{orders.filter((o) => o.status === "to_ship" && o.carrier === c).length} กล่อง</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
