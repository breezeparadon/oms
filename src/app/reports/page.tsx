"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Kpi, PageHeader, PlatformBadge, ProductThumb } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { DAY, FREE_GIFT_SKU, NOW, PLATFORMS, PLATFORM_IDS, productBySku, orderTotal } from "@/lib/mock-data"
import { baht, dayKey, num, shortDay } from "@/lib/format"

const revConfig = { revenue: { label: "ยอดขาย", color: "#9200ff" }, profit: { label: "กำไรขั้นต้น", color: "#f26b21" } } satisfies ChartConfig
const pieConfig = Object.fromEntries(PLATFORM_IDS.map((p) => [p, { label: PLATFORMS[p].name, color: PLATFORMS[p].color }])) as ChartConfig

export default function ReportsPage() {
  const { orders, conversations } = useOms()
  const valid = orders.filter((o) => o.status !== "cancelled" && o.createdAt > NOW - 30 * DAY)
  const revenue = valid.reduce((s, o) => s + orderTotal(o), 0)
  const cost = valid.reduce((s, o) => s + o.items.reduce((a, i) => a + productBySku(i.sku).cost * i.qty, 0), 0)
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = NOW - (29 - i) * DAY
    const day = valid.filter((o) => dayKey(o.createdAt) === dayKey(d))
    const r = day.reduce((s, o) => s + orderTotal(o), 0)
    const c = day.reduce((s, o) => s + o.items.reduce((a, it) => a + productBySku(it.sku).cost * it.qty, 0), 0)
    return { day: shortDay(d), revenue: r, profit: r - c }
  })
  const pie = PLATFORM_IDS.map((p) => ({ platform: p, value: valid.filter((o) => o.platform === p).reduce((s, o) => s + orderTotal(o), 0) }))
  const skuMap = new Map<string, { qty: number; rev: number }>()
  for (const o of valid) for (const i of o.items) {
    const cur = skuMap.get(i.sku) ?? { qty: 0, rev: 0 }
    cur.qty += i.qty
    cur.rev += i.qty * i.price
    skuMap.set(i.sku, cur)
  }
  const top = [...skuMap.entries()].filter(([s]) => s !== FREE_GIFT_SKU).sort((a, b) => b[1].rev - a[1].rev).slice(0, 10)
  const replied = conversations.filter((c) => c.messages.some((m) => m.from === "agent")).length
  const chatConv = PLATFORM_IDS.map((p) => {
    const convs = conversations.filter((c) => c.platform === p).length
    const buyers = new Set(orders.filter((o) => o.platform === p).map((o) => o.customerId)).size
    return { p: PLATFORMS[p].short, convs, buyers }
  })

  return (
    <div className="space-y-4">
      <PageHeader title="รายงาน" description="30 วันล่าสุด — ข้อมูลรวมทุกช่องทาง" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="ยอดขาย" value={baht(revenue)} tone="good" />
        <Kpi label="กำไรขั้นต้น" value={baht(revenue - cost)} hint={`มาร์จิ้น ${Math.round(((revenue - cost) / revenue) * 100)}%`} tone="good" />
        <Kpi label="ออเดอร์ / ค่าเฉลี่ย" value={num(valid.length)} hint={`เฉลี่ย ${baht(revenue / valid.length)} / ออเดอร์`} />
        <Kpi label="อัตราตอบแชท" value={`${Math.round((replied / conversations.length) * 100)}%`} hint={`${conversations.length} แชท`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ยอดขายและกำไรรายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revConfig} className="aspect-auto h-72 w-full">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} interval={4} />
                <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="revenue" stroke="var(--color-revenue)" fill="url(#gRev)" strokeWidth={2} />
                <Area dataKey="profit" stroke="var(--color-profit)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนยอดขายตามช่องทาง</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="mx-auto aspect-square h-56">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="platform" hideLabel />} />
                <Pie data={pie} dataKey="value" nameKey="platform" innerRadius={55} strokeWidth={2}>
                  {pie.map((d) => (
                    <Cell key={d.platform} fill={PLATFORMS[d.platform].color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-2 space-y-1 text-sm">
              {pie.sort((a, b) => b.value - a.value).map((d) => (
                <div key={d.platform} className="flex justify-between">
                  <PlatformBadge platform={d.platform} />
                  <span className="tabular-nums">{Math.round((d.value / revenue) * 100)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-0">
          <CardHeader className="pt-4">
            <CardTitle>สินค้าขายดี Top 10</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead className="text-right">ชิ้น</TableHead>
                <TableHead className="text-right">ยอดขาย</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map(([sku, v], i) => (
                <TableRow key={sku}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <ProductThumb sku={sku} />
                      <div className="min-w-0">
                        <div className="line-clamp-2">{productBySku(sku).name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{sku}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{v.qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{baht(v.rev)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>แชท vs ผู้ซื้อ ต่อช่องทาง</CardTitle>
            <CardDescription>ใช้ดูว่าช่องทางไหนแชทเยอะแต่ปิดการขายได้น้อย</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ convs: { label: "แชท", color: "#c414e0" }, buyers: { label: "ผู้ซื้อ", color: "#9200ff" } }} className="aspect-auto h-64 w-full">
              <BarChart data={chatConv}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="p" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="convs" fill="var(--color-convs)" radius={4} />
                <Bar dataKey="buyers" fill="var(--color-buyers)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
