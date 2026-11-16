"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ImageUp, Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FilterSelect, PageHeader, PlatformDot, ProductThumb, TierBadge } from "@/components/oms/bits"
import { useOms } from "@/components/oms/store"
import { CARRIERS, PLATFORMS, SHOPS, type Order, type PlatformId } from "@/lib/mock-data"
import { baht } from "@/lib/format"
import { cn } from "@/lib/utils"

const SOCIAL: PlatformId[] = ["lineoa", "facebook", "instagram"]

export function NewOrderForm() {
  const params = useSearchParams()
  const router = useRouter()
  const { customers, products, reserved, addOrder, sendMessage } = useOms()
  const preset = customers.find((c) => c.id === params.get("customer"))
  const convId = params.get("conv")
  const presetPlatform = (params.get("platform") as PlatformId) || (preset && SOCIAL.includes(preset.identities[0].platform) ? preset.identities[0].platform : "lineoa")

  const [platform, setPlatform] = React.useState<PlatformId>(SOCIAL.includes(presetPlatform) ? presetPlatform : "lineoa")
  const [customerId, setCustomerId] = React.useState(preset?.id ?? "")
  const [custQ, setCustQ] = React.useState("")
  const [items, setItems] = React.useState<{ sku: string; qty: number }[]>(() => (params.get("sku") && products.some((p) => p.sku === params.get("sku")) ? [{ sku: params.get("sku")!, qty: 1 }] : []))
  const [prodQ, setProdQ] = React.useState("")
  const [payment, setPayment] = React.useState<Order["payment"]>("transfer")
  const [carrier, setCarrier] = React.useState<string>("Flash Express")
  const [shipping, setShipping] = React.useState(40)
  const [discount, setDiscount] = React.useState(0)
  const [slip, setSlip] = React.useState(false)
  const [note, setNote] = React.useState("")

  const customer = customers.find((c) => c.id === customerId)
  const custResults = custQ ? customers.filter((c) => c.name.includes(custQ) || c.phone.replace(/-/g, "").includes(custQ.replace(/-/g, ""))).slice(0, 6) : []
  const prodResults = products.filter((p) => p.price > 0 && (!prodQ || p.name.includes(prodQ) || p.sku.toLowerCase().includes(prodQ.toLowerCase()))).slice(0, 8)
  const subtotal = items.reduce((s, i) => s + i.qty * products.find((p) => p.sku === i.sku)!.price, 0)
  const total = subtotal + shipping - discount

  const [flash, setFlash] = React.useState<{ sku: string; n: number } | null>(null)

  // Visual feedback: card pops, a ghost copy scales up & fades out, "+1" floats away
  const addFx = (el: HTMLElement, sku: string) => {
    add(sku)
    setFlash((f) => ({ sku, n: (f?.n ?? 0) + 1 }))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    el.animate([{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(0.98)" }, { transform: "scale(1)" }], { duration: 360, easing: "cubic-bezier(.3,1.5,.5,1)" })
    const r = el.getBoundingClientRect()
    const ghost = el.cloneNode(true) as HTMLElement
    Object.assign(ghost.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: "0", zIndex: "60", pointerEvents: "none", background: "var(--card)", borderColor: "var(--primary)", boxShadow: "0 10px 30px -8px color-mix(in oklab, var(--primary) 55%, transparent)" })
    document.body.appendChild(ghost)
    ghost.animate([{ transform: "scale(1)", opacity: 0.95 }, { transform: "scale(1.22)", opacity: 0 }], { duration: 520, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => ghost.remove()
    const plus = document.createElement("span")
    plus.textContent = "+1"
    Object.assign(plus.style, { position: "fixed", left: `${r.right - 34}px`, top: `${r.top + 6}px`, zIndex: "61", pointerEvents: "none", padding: "2px 8px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", color: "#fff", backgroundImage: "var(--brand-gradient)" })
    document.body.appendChild(plus)
    plus.animate([{ transform: "translateY(0) scale(.6)", opacity: 0 }, { transform: "translateY(-10px) scale(1.1)", opacity: 1, offset: 0.3 }, { transform: "translateY(-34px) scale(1)", opacity: 0 }], { duration: 700, easing: "ease-out" }).onfinish = () => plus.remove()
  }

  const add = (sku: string) => setItems((prev) => (prev.some((i) => i.sku === sku) ? prev.map((i) => (i.sku === sku ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { sku, qty: 1 }]))

  const submit = () => {
    if (!customer) return toast.error("กรุณาเลือกลูกค้า")
    if (!items.length) return toast.error("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ")
    if (payment === "transfer" && !slip) return toast.error("กรุณาแนบสลิปโอนเงิน หรือเลือกเก็บเงินปลายทาง")
    const shop = SHOPS.find((s) => s.platform === platform)!
    const id = addOrder({
      platformOrderNo: `${PLATFORMS[platform].short}-${String(Date.now()).slice(-5)}`,
      platform,
      shopId: shop.id,
      customerId: customer.id,
      items: items.map((i) => ({ ...i, price: products.find((p) => p.sku === i.sku)!.price })),
      shippingFee: shipping,
      discount,
      payment,
      status: "to_process",
      carrier,
      labelPrinted: false,
      createdAt: 0,
      shipBy: 0,
      tags: ["สร้างจากแชท"],
      warehouse: "bkk",
      note,
    })
    if (convId) sendMessage(convId, `ยืนยันออเดอร์ ${id} ยอด ${baht(total)} ค่ะ จะจัดส่งภายใน 1-2 วันทำการนะคะ 🙏`)
    toast.success(`สร้างออเดอร์ ${id} แล้ว`, { description: "ตัดสต๊อกกลางเรียบร้อย — ทุกช่องทางอัปเดตจำนวนคงเหลือ" })
    router.push(convId ? `/inbox?c=${convId}` : "/orders?status=to_process")
  }

  return (
    <div className="space-y-4">
      <PageHeader title="สร้างออเดอร์จากแชท" description="สำหรับช่องทางที่ไม่มีระบบตะกร้า: LINE OA, Facebook, Instagram — ออเดอร์เข้าสู่ขั้นตอนเดียวกับ marketplace" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>1. ช่องทางและลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SOCIAL.map((p) => (
                  <button key={p} onClick={() => setPlatform(p)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", platform === p && "border-primary ring-2 ring-primary/20")}>
                    <PlatformDot platform={p} /> {PLATFORMS[p].name}
                  </button>
                ))}
              </div>
              {customer ? (
                <div className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      {customer.name} <TierBadge tier={customer.tier} />
                    </div>
                    <div className="text-muted-foreground">{customer.phone}</div>
                    <div className="text-muted-foreground">
                      {customer.address} {customer.district} {customer.province} {customer.zip}
                    </div>
                    {customer.blacklisted && <div className="mt-1 text-xs text-rose-600">⚠ ลูกค้าบัญชีดำ: {customer.note}</div>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCustomerId("")}>
                    เปลี่ยน
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>ค้นหาลูกค้าเดิม (ชื่อ / เบอร์โทร)</Label>
                  <Input value={custQ} onChange={(e) => setCustQ(e.target.value)} placeholder="เช่น 081 หรือ สมชาย" />
                  <div className="divide-y rounded-lg border empty:hidden">
                    {custResults.map((c) => (
                      <button key={c.id} onClick={() => setCustomerId(c.id)} className="flex w-full items-center justify-between p-2.5 text-left text-sm hover:bg-muted">
                        <span>
                          {c.name} <span className="text-muted-foreground">· {c.phone}</span>
                        </span>
                        <span className="flex gap-1">
                          {c.identities.map((i) => (
                            <PlatformDot key={i.platform} platform={i.platform} />
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">ไม่พบ? ลูกค้าใหม่จะถูกสร้างอัตโนมัติจากชื่อ/ที่อยู่ที่แอดมินกรอก (mockup)</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. สินค้า</CardTitle>
              <CardDescription>แสดงจำนวนพร้อมขายจากสต๊อกกลาง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={prodQ} onChange={(e) => setProdQ(e.target.value)} placeholder="ค้นหาสินค้า / SKU" />
              <div className="grid gap-2 sm:grid-cols-2">
                {prodResults.map((p) => {
                  const avail = p.stock.bkk + p.stock.cnx - reserved(p.sku)
                  const inCart = items.find((i) => i.sku === p.sku)?.qty ?? 0
                  return (
                    <button
                      key={p.sku}
                      disabled={avail <= 0}
                      onClick={(e) => addFx(e.currentTarget, p.sku)}
                      className={cn(
                        "relative flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent/40 active:scale-[.98] disabled:opacity-50",
                        inCart > 0 && "border-primary bg-accent/50",
                      )}
                    >
                      {inCart > 0 && <span className="absolute -top-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gradient px-1.5 text-[11px] font-bold text-white shadow">{inCart}</span>}
                      <ProductThumb sku={p.sku} className="size-12" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-xs leading-snug">{p.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{p.sku}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-medium">{baht(p.price)}</span>
                        <span className={cn("text-xs", avail <= p.safety ? "text-amber-600" : "text-muted-foreground")}>{avail <= 0 ? "หมด" : `คงเหลือ ${avail}`}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {items.length > 0 && (
                <div className="divide-y rounded-lg border">
                  {items.map((i) => {
                    const p = products.find((x) => x.sku === i.sku)!
                    return (
                      <div key={flash?.sku === i.sku ? `${i.sku}-${flash.n}` : i.sku} className={cn("flex items-center justify-between gap-2 p-2.5 text-sm", flash?.sku === i.sku && "animate-cart-flash")}>
                        <span className="flex min-w-0 items-center gap-2">
                          <ProductThumb sku={i.sku} className="size-9" />
                          <span className="truncate">{p.name}</span>
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button size="icon-xs" variant="outline" onClick={() => setItems((prev) => prev.map((x) => (x.sku === i.sku ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}>
                            <Minus />
                          </Button>
                          <span className="w-6 text-center tabular-nums">{i.qty}</span>
                          <Button size="icon-xs" variant="outline" onClick={() => { add(i.sku); setFlash((f) => ({ sku: i.sku, n: (f?.n ?? 0) + 1 })) }}>
                            <Plus />
                          </Button>
                          <span className="w-20 text-right tabular-nums">{baht(p.price * i.qty)}</span>
                          <Button size="icon-xs" variant="ghost" onClick={() => setItems((prev) => prev.filter((x) => x.sku !== i.sku))}>
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3. ชำระเงินและจัดส่ง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1.5">
                <Label>วิธีชำระเงิน</Label>
                <FilterSelect value={payment} onChange={(v) => setPayment(v as Order["payment"])} className="w-full" options={[{ value: "transfer", label: "โอนเงิน (แนบสลิป)" }, { value: "cod", label: "เก็บเงินปลายทาง (COD)" }]} />
              </div>
              {payment === "transfer" && (
                <button onClick={() => setSlip(true)} className={cn("flex w-full flex-col items-center gap-1 rounded-lg border border-dashed p-4 text-muted-foreground", slip && "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40")}>
                  <ImageUp className="size-5" />
                  {slip ? "แนบสลิปแล้ว ✓ (ตรวจยอดอัตโนมัติ: ตรงกัน)" : "คลิกเพื่อแนบสลิปโอนเงิน"}
                </button>
              )}
              <div className="space-y-1.5">
                <Label>ขนส่ง</Label>
                <FilterSelect value={carrier} onChange={setCarrier} className="w-full" options={CARRIERS.filter((c) => !["SPX Express", "LEX TH"].includes(c)).map((c) => ({ value: c, label: c }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>ค่าส่ง</Label>
                  <Input type="number" value={shipping} onChange={(e) => setShipping(Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label>ส่วนลด</Label>
                  <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>หมายเหตุ</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ห่อของขวัญ, ส่งก่อนเที่ยง" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ยอดสินค้า</span>{baht(subtotal)}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">ค่าส่ง</span>{baht(shipping)}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">ส่วนลด</span>-{baht(discount)}</div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>ยอดสุทธิ</span>{baht(total)}</div>
              <Button className="mt-2 w-full" size="lg" onClick={submit}>
                ยืนยันสร้างออเดอร์
              </Button>
              {convId && <div className="text-center text-xs text-muted-foreground">ระบบจะส่งข้อความยืนยันกลับไปในแชทอัตโนมัติ</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
