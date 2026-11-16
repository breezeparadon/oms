import { NOW } from "./mock-data"

const TZ = "Asia/Bangkok"

export const baht = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n)

export const num = (n: number) => new Intl.NumberFormat("th-TH").format(n)

export const dateTime = (t: number) =>
  new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(t)

export const dateOnly = (t: number) =>
  new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short", year: "2-digit" }).format(t)

export const timeOnly = (t: number) =>
  new Intl.DateTimeFormat("th-TH", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(t)

export const dayKey = (t: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(t)

export const shortDay = (t: number) =>
  new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short" }).format(t)

export function ago(t: number) {
  const m = Math.round((NOW - t) / 60_000)
  if (m < 1) return "เมื่อสักครู่"
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} ชม.ที่แล้ว`
  return `${Math.round(h / 24)} วันที่แล้ว`
}

export function dueIn(t: number) {
  const h = (t - NOW) / 3_600_000
  if (h < 0) return { text: `เลยกำหนด ${Math.ceil(-h)} ชม.`, urgent: true }
  if (h < 24) return { text: `เหลือ ${Math.floor(h)} ชม.`, urgent: true }
  return { text: `เหลือ ${Math.floor(h / 24)} วัน`, urgent: false }
}
