import { NextResponse } from "next/server";

export async function POST() {
  // TODO: verify provider signature, update reservation to PAID/FAILED idempotently
  return NextResponse.json({ received: true });
}
