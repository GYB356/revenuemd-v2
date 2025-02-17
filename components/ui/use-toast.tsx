import { useState, useCallback } from "react"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

interface Toast extends ToastProps {
  id: string
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (props: ToastProps) => void
  dismiss: (id: string) => void
}

const useToastStore = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
}

export function useToast() {
  const store = useToastStore()
  return store
} 