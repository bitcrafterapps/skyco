/**
 * Simple in-process SSE broadcaster.
 * Maintains a set of connected writable controllers and broadcasts messages to all.
 */

type SSEController = ReadableStreamDefaultController<Uint8Array>;

const clients: Set<SSEController> = new Set();

const encoder = new TextEncoder();

/**
 * Register a new SSE client controller. Returns a cleanup function.
 */
export function addClient(controller: SSEController): () => void {
  clients.add(controller);
  return () => {
    clients.delete(controller);
  };
}

/**
 * Broadcast a JSON event to all connected SSE clients.
 */
export function broadcast(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(payload);
  for (const controller of clients) {
    try {
      controller.enqueue(encoded);
    } catch {
      // Client disconnected; remove it
      clients.delete(controller);
    }
  }
}

/**
 * Get the current number of connected clients (useful for debugging).
 */
export function clientCount(): number {
  return clients.size;
}
