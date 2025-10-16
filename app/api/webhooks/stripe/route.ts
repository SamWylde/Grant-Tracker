import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, { apiVersion: "2023-10-16" });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return Response.json({ error: "Stripe webhook not configured" }, { status: 501 });
  }

  const signature = headers().get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const rawBody = await request.arrayBuffer();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.info("Checkout session completed", {
        id: session.id,
        customer: session.customer,
        subscription: session.subscription
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn("Invoice payment failed", {
        id: invoice.id,
        customer: invoice.customer
      });
      break;
    }
    default: {
      console.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  return new Response("ok");
}
