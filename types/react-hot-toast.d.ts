declare module 'react-hot-toast' {
  type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'

  interface ToastOptions {
    duration?: number
    position?: ToastPosition
    className?: string
    style?: React.CSSProperties
    icon?: React.ReactNode
  }

  interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'loading'
    position: ToastPosition
    duration: number
    visible: boolean
  }

  interface Toaster {
    success(message: string, options?: ToastOptions): string
    error(message: string, options?: ToastOptions): string
    loading(message: string, options?: ToastOptions): string
    dismiss(toastId?: string): void
    remove(toastId?: string): void
  }

  const toast: Toaster

  export { toast }
  export default toast
} 