"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

/**
 * Numeric input that keeps what the user types as text, so the field can be
 * empty while editing (no stuck "0"), selects its content on focus, and only
 * reports a number to the parent. Empty → 0.
 */
export function NumberInput({
  value,
  onValueChange,
  allowNegative = false,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number
  onValueChange: (n: number) => void
  allowNegative?: boolean
}) {
  const [text, setText] = React.useState(value ? String(value) : "")

  // Sync when the parent changes the value (e.g. quick "+10" buttons) — adjust during render
  const [prev, setPrev] = React.useState(value)
  if (value !== prev) {
    setPrev(value)
    if (Number(text === "-" ? 0 : text || 0) !== value) setText(value ? String(value) : "")
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode={allowNegative ? "text" : "numeric"}
      placeholder={props.placeholder ?? "0"}
      value={text}
      onFocus={(e) => {
        e.currentTarget.select()
        props.onFocus?.(e)
      }}
      onChange={(e) => {
        let t = e.target.value.replace(allowNegative ? /[^\d-]/g : /\D/g, "")
        if (allowNegative) t = t.replace(/(?!^)-/g, "")
        t = t.replace(/^(-?)0+(?=\d)/, "$1") // drop leading zeros
        setText(t)
        onValueChange(t === "" || t === "-" ? 0 : Number(t))
      }}
    />
  )
}
