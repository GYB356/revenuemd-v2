import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "end"
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            setIsOpen,
          })
        }
        return child
      })}
    </div>
  )
}

export function DropdownMenuTrigger({
  children,
  className,
  asChild,
}: DropdownMenuTriggerProps) {
  return (
    <button
      className={cn("inline-flex items-center justify-center", className)}
      onClick={(e) => {
        e.stopPropagation()
        const parent = e.currentTarget.closest("[data-state]")
        if (parent) {
          const currentState = parent.getAttribute("data-state")
          parent.setAttribute(
            "data-state",
            currentState === "open" ? "closed" : "open"
          )
        }
      }}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  className,
  align = "end",
}: DropdownMenuContentProps) {
  return (
    <div
      className={cn(
        "absolute mt-2 min-w-[8rem] rounded-md border bg-white p-1 shadow-md",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {children}
    </button>
  )
}

export function DropdownMenuLabel({
  children,
  className,
}: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-sm font-semibold text-gray-900",
        className
      )}
    >
      {children}
    </div>
  )
} 