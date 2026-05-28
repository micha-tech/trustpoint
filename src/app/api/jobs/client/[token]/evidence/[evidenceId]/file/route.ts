import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken } from "@/lib/security/tokens";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; evidenceId: string }> }
) {
  try {
    const { token, evidenceId } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, jobId },
    });
    if (!evidence) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return new NextResponse(evidence.data, {
      headers: {
        "Content-Type": evidence.fileType,
        "Content-Length": String(evidence.fileSize),
        "Content-Disposition": `inline; filename="${evidence.fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  }
}
