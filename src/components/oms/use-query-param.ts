"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

/**
 * Keep a piece of UI state in the URL query string (e.g. ?sku=100220049) so the
 * current view can be shared as a link. Uses history.replaceState, which Next.js
 * syncs into useSearchParams without a navigation/reload.
 */
export function useQueryParam(key: string): [string | null, (v: string | null) => void] {
  const params = useSearchParams()
  const value = params.get(key)
  const set = React.useCallback(
    (v: string | null) => {
      const p = new URLSearchParams(window.location.search)
      if (v === null || v === "") p.delete(key)
      else p.set(key, v)
      const qs = p.toString()
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
    },
    [key],
  )
  return [value, set]
}
