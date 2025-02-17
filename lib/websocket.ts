import { toast } from 'sonner'

type WebSocketMessage = {
  type: 'update' | 'notification' | 'alert'
  payload: any
}

type WebSocketOptions = {
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onReconnect?: () => void
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout = 1000 // Start with 1 second
  private options: WebSocketOptions

  constructor(private url: string, options: WebSocketOptions = {}) {
    this.options = options
    this.connect()
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.reconnectTimeout = 1000
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        this.options.onError?.(event)
      }

      this.ws.onclose = () => {
        console.log('WebSocket closed')
        this.handleReconnect()
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      this.handleReconnect()
    }
  }

  private handleMessage(message: WebSocketMessage) {
    this.options.onMessage?.(message)

    switch (message.type) {
      case 'notification':
        toast(message.payload.message)
        break
      case 'alert':
        toast.error(message.payload.message)
        break
      case 'update':
        // Handle data updates
        break
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connect()
        this.options.onReconnect?.()
      }, this.reconnectTimeout)

      // Exponential backoff
      this.reconnectTimeout *= 2
    } else {
      console.error('Max reconnection attempts reached')
      toast.error('Connection lost. Please refresh the page.')
    }
  }

  public send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
      toast.error('Unable to send message. Connection lost.')
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}