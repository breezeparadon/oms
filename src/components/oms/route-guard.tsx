"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROLES, canOpen } from "@/lib/mock-data"
import { useOms } from "./store"
import { CRM_BASE, isCrmPath } from "./crm-mode"

/** Hides pages the current role may not open (demo of role-based access) */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { me } = useOms()
  if (canOpen(me.role, pathname)) return <>{children}</>
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950">
        <ShieldX className="size-7" />
      </span>
      <div className="text-lg font-semibold">ไม่มีสิทธิ์เข้าหน้านี้</div>
      <p className="text-sm text-muted-foreground">
        {me.name} ({ROLES[me.role].label}) ไม่ได้รับสิทธิ์ให้เปิดหน้านี้ — ติดต่อผู้จัดการหากต้องการสิทธิ์เพิ่ม หรือสลับผู้ใช้ที่รูปโปรไฟล์มุมขวาบน (เดโม)
      </p>
      {isCrmPath(pathname) ? <Button render={<Link href={CRM_BASE} />}>กลับหน้าแชทรวม</Button> : <Button render={<Link href="/" />}>กลับหน้าแดชบอร์ด</Button>}
    </div>
  )
}
