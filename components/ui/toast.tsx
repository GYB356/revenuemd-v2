import { useToast } from "./use-toast"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  id: string
}

export function Toast({ title, description, variant = "default", id }: ToastProps) {
  const { dismiss } = useToast()

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        {
          "bg-background text-foreground": variant === "default",
          "bg-destructive text-destructive-foreground": variant === "destructive",
        }
      )}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      <button
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        onClick={() => dismiss(id)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div key={toast.id} className="mb-2">
          <Toast {...toast} />
        </div>
      ))}
    </div>
  )
} 