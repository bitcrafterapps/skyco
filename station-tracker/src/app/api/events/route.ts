import { addClient } from "@/lib/sse";


/**
 * GET /api/events
 * Server-Sent Events endpoint for real-time updates.
 * Clients connect and receive events when orders are created, updated, or have status changes.
 *
 * Events:
 *   - order-created: a new order was created
 *   - order-updated: an order's fields were updated
 *   - order-deleted: an order was deleted
 *   - order-status-changed: a station status was toggled (done/hold/missing)
 */
export async function GET() {
  // Ensure DB is ready before starting SSE stream
  // prisma handles connection automatically

  const encoder = new TextEncoder();

  let removeClient: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ message: "Connected to station-tracker events" })}\n\n`)
      );

      // Register this client
      removeClient = addClient(controller);

      // Send a heartbeat every 30 seconds to keep the connection alive
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // Controller closed, clean up
          if (heartbeat) clearInterval(heartbeat);
          removeClient?.();
        }
      }, 30000);
    },
    cancel() {
      // Client disconnected - clean up heartbeat and remove from client set
      if (heartbeat) clearInterval(heartbeat);
      removeClient?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// SSE should not be statically generated
export const dynamic = "force-dynamic";
