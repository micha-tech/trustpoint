import { NextRequest, NextResponse } from "next/server";

export function validateOrigin(req: NextRequest): NextResponse | undefined {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const allowedOrigins = [
    host ? `https://${host}` : null,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean) as string[];
  if (!origin || !allowedOrigins.some((a) => origin === a)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
