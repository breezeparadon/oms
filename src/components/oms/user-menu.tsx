"use client"

import { Check, LogOut, ShieldCheck, Users } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ROLES, USERS, type Role } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Pill } from "./bits"
import { useOms } from "./store"

const AVATAR: Record<Role, string> = {
  owner: "bg-brand-gradient",
  sales: "bg-primary",
  warehouse: "bg-amber-500",
  accounting: "bg-emerald-600",
}

export function UserAvatar({ short, role, className }: { short: string; role: Role; className?: string }) {
  return <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white", AVATAR[role], className)}>{short}</span>
}

/** Demo "login": switch the current staff user to show role-based menus and locking */
export function UserMenu() {
  const { me, setMe } = useOms()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="บัญชีผู้ใช้">
        <UserAvatar short={me.short} role={me.role} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 py-2">
            <UserAvatar short={me.short} role={me.role} className="size-10" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{me.name}</div>
              <Pill className={cn("mt-0.5", ROLES[me.role].className)}>{ROLES[me.role].label}</Pill>
            </div>
          </DropdownMenuLabel>
          <div className="px-2 pb-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="mr-1 inline size-3" />
            {ROLES[me.role].desc}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <Users className="size-3.5" /> สลับผู้ใช้ (เดโม)
          </DropdownMenuLabel>
          {USERS.map((u) => (
            <DropdownMenuItem
              key={u.id}
              onClick={() => {
                if (u.id === me.id) return
                setMe(u.id)
                toast(`เข้าสู่ระบบเป็น ${u.name}`, { description: `สิทธิ์: ${ROLES[u.role].label} — เมนูและปุ่มจะเปลี่ยนตามสิทธิ์` })
              }}
            >
              <UserAvatar short={u.short} role={u.role} className="size-6 text-[10px]" />
              <span className="flex-1 truncate">{u.name}</span>
              <span className="text-[10px] text-muted-foreground">{ROLES[u.role].label}</span>
              {u.id === me.id && <Check className="text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <LogOut /> ออกจากระบบ (ระบบจริงเท่านั้น)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
