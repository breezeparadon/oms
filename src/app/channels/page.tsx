"use client"

import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, Link2, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PageHeader, PlatformDot, Pill } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { PLATFORMS, SHOPS } from "@/lib/mock-data"
import { ago } from "@/lib/format"

const CAPS: Record<string, string[]> = {
  marketplace: ["ดึงออเดอร์อัตโนมัติ", "ซิงค์สต๊อก", "พิมพ์ใบปะหน้าจากแพลตฟอร์ม", "อัปเดตสถานะจัดส่ง", "แชทลูกค้า"],
  social: ["รวมแชทเข้ากล่องเดียว", "สร้างออเดอร์จากแชท", "ส่งข้อความยืนยัน/เลขพัสดุอัตโนมัติ", "บรอดแคสต์โปรโมชัน"],
}

export default function ChannelsPage() {
  const { orders, conversations } = useOms()
  return (
    <div className="space-y-4">
      <PageHeader
        title="เชื่อมต่อช่องทางการขาย"
        description="เชื่อมร้านค้าผ่าน Official API ของแต่ละแพลตฟอร์ม (OAuth) — ไม่ต้องให้รหัสผ่านร้าน"
        actions={
          <Button onClick={() => toast("เปิดหน้าเชื่อมต่อร้านค้าใหม่ (จำลอง)")}>
            <Plus /> เชื่อมร้านค้าใหม่
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SHOPS.map((s) => {
          const p = PLATFORMS[s.platform]
          const expiring = s.tokenExpiresInDays <= 7
          return (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <PlatformDot platform={s.platform} className="size-10 rounded-xl text-sm" />
                    <div>
                      <CardTitle>{s.name}</CardTitle>
                      <CardDescription>{p.name}</CardDescription>
                    </div>
                  </div>
                  <Switch defaultChecked={s.connected} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-1">
                  {expiring ? (
                    <Pill className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <AlertTriangle className="mr-1 size-3" /> สิทธิ์เชื่อมต่อหมดอายุใน {s.tokenExpiresInDays} วัน
                    </Pill>
                  ) : (
                    <Pill className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="mr-1 size-3" /> เชื่อมต่อแล้ว
                    </Pill>
                  )}
                  <Pill className="bg-muted">ซิงค์ล่าสุด {ago(s.lastSync)}</Pill>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">ออเดอร์</div>
                    <div className="font-semibold">{orders.filter((o) => o.shopId === s.id).length}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-xs text-muted-foreground">แชท</div>
                    <div className="font-semibold">{conversations.filter((c) => c.shopId === s.id).length}</div>
                  </div>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {CAPS[p.kind].map((c) => (
                    <li key={c} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500" /> {c}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success(`ซิงค์ ${s.name} แล้ว`)}>
                    <RefreshCw /> ซิงค์ตอนนี้
                  </Button>
                  {expiring && (
                    <Button size="sm" onClick={() => toast.success("ต่ออายุการเชื่อมต่อแล้ว (จำลอง)")}>
                      <Link2 /> ต่ออายุ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
