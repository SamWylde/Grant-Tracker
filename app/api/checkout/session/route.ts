import { NextRequest } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function getStripeClient(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secret, { apiVersion: "2023-10-16" });
}

type CheckoutBody = {
  priceId?: string;
  mode?: "subscription" | "payment";
  quantity?: number;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
};

export async function POST(request: NextRequest) {
  let payload: CheckoutBody;
  try {
    payload = (await request.json()) as CheckoutBody;
  } catch (error) {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      { error: "Stripe is not configured" },
      { status: 501 }
    );
  }

  const successUrl =
    payload.successUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/checkout/success`;
  const cancelUrl =
    payload.cancelUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/checkout/cancel`;

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: payload.mode ?? "subscription",
      line_items: payload.priceId
        ? [
            {
              price: payload.priceId,
              quantity: payload.quantity ?? 1
            }
          ]
        : undefined,
      allow_promotion_codes: true,
      metadata: payload.metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: payload.customerEmail
    });

    return Response.json({ id: session.id, url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session";
    return Response.json({ error: message }, { status: 500 });
  }
}
