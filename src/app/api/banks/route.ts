import { NextResponse } from "next/server";
import { listBanks } from "@/lib/paystack";

export async function GET() {
  try {
    const banks = await listBanks();
    const mapped = banks.map((b: { name: string; code: string; slug: string; longcode: string }) => ({
      name: b.name,
      code: b.code,
      slug: b.slug,
    }));
    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Could not fetch banks" }, { status: 500 });
  }
}
