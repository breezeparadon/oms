"use client"

import { usePathname } from "next/navigation"

/**
 * CRM-only edition of the mockup, served under /only-inbox.
 * Same screens as the full system, minus everything that depends on OMS data
 * (orders, stock, fulfillment, returns) — used to show the client what a
 * "chat + customer only" scope looks like.
 */
export const CRM_BASE = "/only-inbox"

export const CRM_PATHS = {
  inbox: CRM_BASE,
  customers: `${CRM_BASE}/customers`,
  channels: `${CRM_BASE}/channels`,
} as const

export const isCrmPath = (pathname: string) => pathname === CRM_BASE || pathname.startsWith(CRM_BASE + "/")

export function useCrmOnly() {
  return isCrmPath(usePathname())
}

/** Base paths for the pages that exist in both editions */
export function useCrmLinks() {
  const crm = useCrmOnly()
  return crm ? CRM_PATHS : { inbox: "/inbox", customers: "/customers", channels: "/channels" }
}
