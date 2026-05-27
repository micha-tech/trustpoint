import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionValue, verifyAdminPassword } from "@/lib/security/admin";
import { validateOrigin } from "@/lib/middleware/origin";

export async function POST(req: NextRequest) {
  const originErr = validateOrigin(req);
  if (originErr) return originErr;

  const { secret } = await req.json();
  if (typeof secret !== "string" || !verifyAdminPassword(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", createAdminSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
