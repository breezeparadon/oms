"use client"

import * as React from "react"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, Clock, DownloadCloud, ImagePlus, Link2, Loader2, PackagePlus, RefreshCw, Sparkles, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PLATFORMS, PRODUCT_GROUPS, productBySku, type Listing, type PlatformId, type Product } from "@/lib/mock-data"
import { baht } from "@/lib/format"
import { cn } from "@/lib/utils"
import { FilterSelect, PlatformDot, ProductThumb } from "./bits"
import { NumberInput } from "./number-input"
import { useOms } from "./store"

const MARKET: PlatformId[] = ["shopee", "lazada", "tiktok"]
const SOCIAL: PlatformId[] = ["lineoa", "facebook", "instagram"]

// Each marketplace has its own category tree — the mockup suggests one per OMS group
const PLATFORM_CATS: Record<string, Record<"shopee" | "lazada" | "tiktok", string[]>> = {
  ความงาม: {
    shopee: ["ความงามและของใช้ส่วนตัว › ดูแลผิวหน้า", "ความงามและของใช้ส่วนตัว › เครื่องสำอาง", "ความงามและของใช้ส่วนตัว › ดูแลเส้นผม"],
    lazada: ["สุขภาพและความงาม › ดูแลผิวหน้า", "สุขภาพและความงาม › เมคอัพ", "สุขภาพและความงาม › ผลิตภัณฑ์ดูแลเส้นผม"],
    tiktok: ["ความงามและของใช้ส่วนตัว › สกินแคร์", "ความงามและของใช้ส่วนตัว › เมคอัพ", "ความงามและของใช้ส่วนตัว › ดูแลผม"],
  },
  ผลิตภัณฑ์เสริมอาหารและยา: {
    shopee: ["สุขภาพ › อาหารเสริมเพื่อสุขภาพ", "สุขภาพ › วิตามินและแร่ธาตุ"],
    lazada: ["สุขภาพและความงาม › อาหารเสริม", "สุขภาพและความงาม › วิตามิน"],
    tiktok: ["สุขภาพ › อาหารเสริม", "สุขภาพ › วิตามิน"],
  },
  สินค้าแฟชั่น: {
    shopee: ["เสื้อผ้าแฟชั่นผู้ชาย › เสื้อยืด", "เสื้อผ้าแฟชั่นผู้หญิง › เสื้อ", "เสื้อผ้าแฟชั่นผู้ชาย › กางเกง"],
    lazada: ["แฟชั่นผู้ชาย › เสื้อผ้า", "แฟชั่นผู้หญิง › เสื้อผ้า"],
    tiktok: ["เสื้อผ้าผู้ชาย › เสื้อ", "เสื้อผ้าผู้หญิง › เสื้อ"],
  },
  อาหารและเครื่องดื่ม: {
    shopee: ["อาหารและเครื่องดื่ม › เครื่องดื่ม", "อาหารและเครื่องดื่ม › อาหารแห้ง"],
    lazada: ["ซูเปอร์มาร์เก็ต › เครื่องดื่ม", "ซูเปอร์มาร์เก็ต › อาหาร"],
    tiktok: ["อาหารและเครื่องดื่ม › เครื่องดื่ม", "อาหารและเครื่องดื่ม › ขนม"],
  },
}
const DEFAULT_CATS = {
  shopee: ["บ้านและสวน › ของใช้ในบ้าน", "กีฬาและกิจกรรมกลางแจ้ง › ฟิตเนส", "สุขภาพ › อุปกรณ์การแพทย์"],
  lazada: ["บ้านและไลฟ์สไตล์ › ของใช้ในบ้าน", "กีฬาและการเดินทาง › ฟิตเนส", "สุขภาพและความงาม › อุปกรณ์สุขภาพ"],
  tiktok: ["บ้านและครัว › ของใช้ในบ้าน", "กีฬาและกิจกรรมกลางแจ้ง › ฟิตเนส", "สุขภาพ › อุปกรณ์สุขภาพ"],
}
const catsFor = (group: string) => PLATFORM_CATS[group] ?? DEFAULT_CATS

type Result = { state: "publishing" | "live" | "pending" | "failed"; note?: string }

// ======================================================================
// + เพิ่มสินค้า : create a master SKU and publish to marketplaces
// ======================================================================
export function AddProductSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { products, addProduct, setListing } = useOms()
  const groups = PRODUCT_GROUPS.filter((g) => g !== "ของแถม")
  const empty = { name: "", brand: "", group: groups[0], sub: "", price: 0, full: 0, cost: 0, bkk: 0, cnx: 0, weight: 0 }
  const [f, setF] = React.useState(empty)
  const [sku, setSku] = React.useState("")
  const [image, setImage] = React.useState<string | undefined>()
  const [publish, setPublish] = React.useState<Record<string, boolean>>({ shopee: true, lazada: true, tiktok: true })
  const [pcat, setPcat] = React.useState<Record<string, string>>({})
  const [results, setResults] = React.useState<Record<string, Result> | null>(null)
  const [createdSku, setCreatedSku] = React.useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const suggestedSku = `HS-${String(products.length + 1).padStart(4, "0")}`
  const subs = [...new Set(products.filter((p) => p.group === f.group).map((p) => p.category))]
  const cats = catsFor(f.group)

  const reset = () => {
    setF(empty)
    setSku("")
    setImage(undefined)
    setPublish({ shopee: true, lazada: true, tiktok: true })
    setPcat({})
    setResults(null)
    setCreatedSku(null)
  }

  const runPublish = (target: PlatformId[], finalSku: string, weight: number) => {
    setResults((r) => ({ ...r, ...Object.fromEntries(target.map((pl) => [pl, { state: "publishing" } as Result])) }))
    target.forEach((pl, i) => {
      setTimeout(
        () => {
          let res: Result = { state: "live", note: "ลงขายแล้ว พร้อมขาย" }
          if (pl === "lazada" && (f.group === "ความงาม" || f.group === "ผลิตภัณฑ์เสริมอาหารและยา")) res = { state: "pending", note: "รอ Lazada ตรวจเลข อย. / ใบอนุญาตแบรนด์ (1–3 วันทำการ)" }
          if (pl === "tiktok" && !weight) res = { state: "failed", note: "ต้องระบุน้ำหนักพัสดุ (กรัม) ก่อนลงขาย" }
          setResults((r) => ({ ...r, [pl]: res }))
          const listing: Listing = { listingId: `${PLATFORMS[pl].short}-${String(Math.abs(hash(finalSku + pl))).slice(0, 6)}`, synced: res.state === "live", state: res.state === "publishing" ? "pending" : res.state, note: res.note }
          setListing(finalSku, pl, res.state === "failed" ? { ...listing, synced: false } : listing)
        },
        700 + i * 650,
      )
    })
  }

  const submit = () => {
    const finalSku = (sku || suggestedSku).trim().toUpperCase()
    if (!f.name.trim()) return toast.error("กรุณากรอกชื่อสินค้า")
    if (!f.price) return toast.error("กรุณาระบุราคาขาย")
    if (products.some((p) => p.sku === finalSku)) return toast.error(`SKU ${finalSku} มีอยู่แล้ว`)
    const target = MARKET.filter((pl) => publish[pl])
    const p: Product = {
      sku: finalSku,
      name: f.name.trim(),
      brand: f.brand.trim() || "-",
      group: f.group,
      category: f.sub || "ทั่วไป",
      price: f.price,
      fullPrice: Math.max(f.full, f.price),
      cost: f.cost || Math.round(f.price * 0.35),
      image,
      stock: { bkk: f.bkk, cnx: f.cnx },
      safety: 15,
      weight: f.weight || undefined,
      // social channels sell straight from the master SKU — no listing to create
      listings: Object.fromEntries(SOCIAL.map((pl) => [pl, { listingId: `${PLATFORMS[pl].short}-${finalSku}`, synced: true, state: "live" } satisfies Listing])),
    }
    addProduct(p)
    setCreatedSku(finalSku)
    setResults({})
    toast.success(`สร้าง SKU กลาง ${finalSku} แล้ว`, { description: target.length ? `กำลังส่งไปลงขาย ${target.map((x) => PLATFORMS[x].name).join(", ")}` : "ยังไม่ได้ลงขายบน marketplace" })
    if (target.length) runPublish(target, finalSku, f.weight)
  }

  const done = results && Object.values(results).every((r) => r.state !== "publishing")

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setTimeout(reset, 300)
      }}
    >
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PackagePlus className="size-5 text-primary" /> เพิ่มสินค้าใหม่
          </SheetTitle>
          <SheetDescription>สร้าง SKU กลางใน OMS แล้วส่งไปลงขายบนแพลตฟอร์มผ่าน API (Shopee add_item · Lazada CreateProduct · TikTok Create Product)</SheetDescription>
        </SheetHeader>

        {!createdSku ? (
          <div className="space-y-5 px-4 pb-6 text-sm">
            {/* 1. info */}
            <section className="space-y-3">
              <div className="font-semibold">1. ข้อมูลสินค้า (SKU กลาง)</div>
              <div className="flex gap-3">
                <label className="flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="size-full object-cover" />
                  ) : (
                    <>
                      <ImagePlus className="size-5" /> เพิ่มรูป
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setImage(URL.createObjectURL(file))
                    }}
                  />
                </label>
                <div className="flex-1 space-y-2">
                  <div className="space-y-1">
                    <Label>ชื่อสินค้า *</Label>
                    <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น Suklife คอลลาเจน 30 ซอง" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>SKU</Label>
                      <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder={suggestedSku} className="font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label>แบรนด์</Label>
                      <Input value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="เช่น Suklife" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>หมวดหมู่</Label>
                  <FilterSelect
                    value={f.group}
                    onChange={(v) => {
                      set("group", v)
                      set("sub", "")
                      setPcat({})
                    }}
                    className="w-full"
                    options={groups.map((g) => ({ value: g, label: g }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>หมวดย่อย</Label>
                  <FilterSelect value={f.sub || "ทั่วไป"} onChange={(v) => set("sub", v)} className="w-full" options={[...new Set(["ทั่วไป", ...subs])].map((c) => ({ value: c, label: c }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>ราคาขาย *</Label>
                  <NumberInput value={f.price} onValueChange={(v) => set("price", v)} />
                </div>
                <div className="space-y-1">
                  <Label>ราคาเต็ม (ขีดฆ่า)</Label>
                  <NumberInput value={f.full} onValueChange={(v) => set("full", v)} />
                </div>
                <div className="space-y-1">
                  <Label>ต้นทุน</Label>
                  <NumberInput value={f.cost} onValueChange={(v) => set("cost", v)} />
                </div>
                <div className="space-y-1">
                  <Label>สต๊อกเริ่มต้น กทม.</Label>
                  <NumberInput value={f.bkk} onValueChange={(v) => set("bkk", v)} />
                </div>
                <div className="space-y-1">
                  <Label>สต๊อกเริ่มต้น ชม.</Label>
                  <NumberInput value={f.cnx} onValueChange={(v) => set("cnx", v)} />
                </div>
                <div className="space-y-1">
                  <Label>น้ำหนักพัสดุ (กรัม)</Label>
                  <NumberInput value={f.weight} onValueChange={(v) => set("weight", v)} placeholder="TikTok บังคับ" />
                </div>
              </div>
            </section>

            {/* 2. publish */}
            <section className="space-y-3">
              <div className="font-semibold">2. ลงขายบนแพลตฟอร์ม</div>
              <div className="divide-y rounded-xl border">
                {MARKET.map((pl) => (
                  <div key={pl} className="flex flex-wrap items-center gap-3 p-3">
                    <Checkbox checked={!!publish[pl]} onCheckedChange={(v) => setPublish((x) => ({ ...x, [pl]: !!v }))} aria-label={PLATFORMS[pl].name} />
                    <PlatformDot platform={pl} />
                    <span className="w-24 font-medium">{PLATFORMS[pl].name}</span>
                    <div className="min-w-56 flex-1">
                      <FilterSelect
                        value={pcat[pl] ?? cats[pl as "shopee"][0]}
                        onChange={(v) => setPcat((x) => ({ ...x, [pl]: v }))}
                        className={cn("w-full", !publish[pl] && "opacity-50")}
                        options={cats[pl as "shopee"].map((c) => ({ value: c, label: c }))}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 bg-muted/40 p-3 text-xs text-muted-foreground">
                  <div className="flex gap-1">
                    {SOCIAL.map((pl) => (
                      <PlatformDot key={pl} platform={pl} className="size-4 text-[7px]" />
                    ))}
                  </div>
                  LINE OA / Facebook / Instagram ไม่มีหน้าร้าน — ใช้ SKU กลางขายในแชทได้ทันที
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                แต่ละแพลตฟอร์มมีหมวดหมู่และข้อมูลบังคับต่างกัน — สินค้าความงาม/อาหารเสริมอาจต้องรอตรวจ อย. ก่อนขายได้
              </div>
            </section>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button onClick={submit}>
                <PackagePlus /> บันทึกและลงขาย
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 px-4 pb-6 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-brand-soft p-3">
              <ProductThumb sku={createdSku} className="size-14" />
              <div className="min-w-0">
                <div className="line-clamp-2 font-semibold">{productBySkuSafe(products, createdSku)?.name}</div>
                <div className="text-xs text-muted-foreground">
                  SKU กลาง <span className="font-mono">{createdSku}</span> · สร้างใน OMS แล้ว ✓
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">ผลการลงขายบนแพลตฟอร์ม</div>
              <div className="divide-y rounded-xl border">
                {MARKET.filter((pl) => results?.[pl]).map((pl) => {
                  const r = results![pl]
                  return (
                    <div key={pl} className="flex items-start gap-3 p-3">
                      <PlatformDot platform={pl} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{PLATFORMS[pl].name}</div>
                        <div className="text-xs text-muted-foreground">{r.state === "publishing" ? "กำลังส่งข้อมูลไปที่แพลตฟอร์ม…" : r.note}</div>
                        {r.state === "failed" && (
                          <div className="mt-2 flex items-center gap-2">
                            <NumberInput value={f.weight} onValueChange={(v) => set("weight", v)} placeholder="น้ำหนัก (กรัม)" className="h-8 w-36" />
                            <Button size="sm" disabled={!f.weight} onClick={() => runPublish([pl], createdSku, f.weight)}>
                              <RefreshCw /> แก้ไขแล้วส่งใหม่
                            </Button>
                          </div>
                        )}
                      </div>
                      {r.state === "publishing" && <Loader2 className="size-5 animate-spin text-primary" />}
                      {r.state === "live" && <CheckCircle2 className="size-5 text-emerald-500" />}
                      {r.state === "pending" && <Clock className="size-5 text-amber-500" />}
                      {r.state === "failed" && <XCircle className="size-5 text-rose-500" />}
                    </div>
                  )
                })}
                {SOCIAL.map((pl) => (
                  <div key={pl} className="flex items-center gap-3 p-3 text-muted-foreground">
                    <PlatformDot platform={pl} />
                    <span className="flex-1">{PLATFORMS[pl].name} — ใช้ได้ในแชททันที</span>
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={!done} onClick={reset}>
                <PackagePlus /> เพิ่มอีกรายการ
              </Button>
              <Button disabled={!done} onClick={() => onOpenChange(false)}>
                เสร็จสิ้น
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
const productBySkuSafe = (list: Product[], sku: string) => list.find((p) => p.sku === sku)
function hash(s: string) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0
  return h
}

// ======================================================================
// ดึงสินค้าจากแพลตฟอร์ม : link unmatched platform listings to master SKUs
// ======================================================================
export function ImportListingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { platformListings, products, linkListing, createFromListing } = useOms()
  const [fetching, setFetching] = React.useState(false)
  const [choice, setChoice] = React.useState<Record<string, string>>({})
  const suggested = platformListings.filter((l) => l.suggestSku && (l.score ?? 0) >= 95)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DownloadCloud className="size-5 text-primary" /> ดึงสินค้าจากแพลตฟอร์ม
          </SheetTitle>
          <SheetDescription>สินค้าที่มีอยู่บน Shopee / Lazada / TikTok แต่ยังไม่ได้ผูกกับ SKU กลาง — ผูกแล้ว OMS จะคุมสต๊อกให้</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={fetching}
              onClick={() => {
                setFetching(true)
                setTimeout(() => {
                  setFetching(false)
                  toast.success("ดึงรายการสินค้าล่าสุดจาก 4 ร้านแล้ว", { description: `พบ ${platformListings.length} รายการที่ยังไม่ได้ผูก` })
                }, 1200)
              }}
            >
              {fetching ? <Loader2 className="animate-spin" /> : <RefreshCw />} ดึงข้อมูลล่าสุด
            </Button>
            <Button
              disabled={!suggested.length}
              onClick={() => {
                suggested.forEach((l) => linkListing(l.id, l.suggestSku!))
              }}
            >
              <Sparkles /> ผูกอัตโนมัติ SKU ที่ตรงกัน ({suggested.length})
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">ยังไม่ได้ผูก {platformListings.length} รายการ</span>
          </div>

          <div className="divide-y rounded-xl border">
            {platformListings.map((l) => {
              const target = choice[l.id] ?? l.suggestSku ?? ""
              return (
                <div key={l.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" className="size-12 rounded-md object-cover ring-1 ring-border" />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border">
                          <ImagePlus className="size-5" />
                        </div>
                      )}
                      <PlatformDot platform={l.platform} className="absolute -right-1.5 -bottom-1.5 size-4 text-[7px] ring-2 ring-background" />
                    </div>
                    <div className="min-w-0">
                      <div className="line-clamp-2">{l.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Seller SKU: <span className="font-mono">{l.sellerSku || "— ไม่ได้ตั้ง —"}</span> · {baht(l.price)} · สต๊อกบนแพลตฟอร์ม {l.stock}
                      </div>
                      {l.suggestSku && (
                        <div className={cn("mt-0.5 text-[11px]", (l.score ?? 0) >= 95 ? "text-emerald-600" : "text-amber-600")}>
                          {(l.score ?? 0) >= 95 ? "✓ SKU ตรงกัน" : `≈ ชื่อคล้าย ${l.score}%`} → {l.suggestSku}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <FilterSelect
                      value={target || "__none"}
                      onChange={(v) => setChoice((c) => ({ ...c, [l.id]: v }))}
                      className="w-56"
                      options={[
                        { value: "__none", label: "เลือก SKU กลางที่จะผูก…" },
                        ...(l.suggestSku ? [{ value: l.suggestSku, label: `★ ${l.suggestSku} · ${productBySku(l.suggestSku).name.slice(0, 26)}…` }] : []),
                        ...products
                          .filter((p) => p.sku !== l.suggestSku && p.price > 0 && !p.listings[l.platform])
                          .slice(0, 40)
                          .map((p) => ({ value: p.sku, label: `${p.sku} · ${p.name.slice(0, 26)}…` })),
                      ]}
                    />
                    <Button size="sm" disabled={!target || target === "__none"} onClick={() => linkListing(l.id, target)}>
                      <Link2 /> ผูก
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => createFromListing(l.id)} title="สร้างเป็น SKU กลางใหม่จากสินค้านี้">
                      <PackagePlus /> สร้างใหม่
                    </Button>
                  </div>
                </div>
              )
            })}
            {platformListings.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <CheckCircle2 className="size-8 text-emerald-500" />
                ผูกครบทุกรายการแล้ว — สต๊อกทุกช่องทางถูกคุมจาก OMS
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
