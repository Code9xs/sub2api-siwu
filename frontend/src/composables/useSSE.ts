/**
 * SSE (Server-Sent Events) Composable
 * Uses fetch + ReadableStream for POST-based SSE (EventSource doesn't support POST with body)
 */

import { ref, type Ref } from 'vue'

export interface SSEOptions {
  /** Called for each content delta */
  onDelta?: (content: string) => void
  /** Called when stream is done */
  onDone?: () => void
  /** Called on error */
  onError?: (error: Error) => void
  /** Called with the full raw SSE data line */
  onData?: (data: string) => void
}

export interface SSEReturn {
  /** Whether the stream is currently active */
  isStreaming: Ref<boolean>
  /** Abort the stream */
  abort: () => void
  /** Start the SSE stream */
  start: (url: string, body: Record<string, unknown>, options?: SSEOptions) => Promise<void>
}

/**
 * Composable for handling SSE streams with POST requests.
 * Supports AbortController for cancellation.
 */
export function useSSE(): SSEReturn {
  const isStreaming = ref(false)
  let abortController: AbortController | null = null

  function abort() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isStreaming.value = false
  }

  async function start(url: string, body: Record<string, unknown>, options: SSEOptions = {}) {
    abort() // Cancel any existing stream

    abortController = new AbortController()
    isStreaming.value = true

    const token = localStorage.getItem('auth_token')
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    const fullURL = `${baseURL}${url}`

    try {
      const response = await fetch(fullURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
        signal: abortController.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`SSE request failed: ${response.status} ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('ReadableStream not supported')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          const data = line.slice(6) // Remove "data: " prefix

          if (data === '[DONE]') {
            options.onDone?.()
            isStreaming.value = false
            return
          }

          options.onData?.(data)

          // Parse OpenAI-format SSE data
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              options.onError?.(new Error(parsed.error))
              isStreaming.value = false
              return
            }
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              options.onDelta?.(delta)
            }
          } catch {
            // Skip non-JSON data lines
          }
        }
      }

      // Stream ended without [DONE]
      options.onDone?.()
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled — not an error
        return
      }
      options.onError?.(error instanceof Error ? error : new Error(String(error)))
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  return { isStreaming, abort, start }
}
