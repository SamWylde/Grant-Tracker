import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PostmarkEvent = {
  RecordType: string;
  MessageID: string;
  Recipient: string;
  DeliveredAt?: string;
  Type?: string;
  Metadata?: Record<string, string>;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostmarkEvent | PostmarkEvent[];
    const events = Array.isArray(body) ? body : [body];

    for (const event of events) {
      const recordType = event.RecordType ?? event.Type ?? "unknown";
      if (recordType === "Bounce") {
        console.warn("Postmark bounce", {
          messageId: event.MessageID,
          recipient: event.Recipient,
          type: event["Type"]
        });
      } else {
        console.info("Postmark event", {
          recordType,
          messageId: event.MessageID,
          recipient: event.Recipient,
          deliveredAt: event.DeliveredAt
        });
      }
    }

    return new Response("ok");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return new Response(message, { status: 400 });
  }
}
