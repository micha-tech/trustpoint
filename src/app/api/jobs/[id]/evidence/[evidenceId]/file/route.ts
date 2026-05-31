import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; evidenceId: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "") || searchParams.get("token") || "";
    if (!authToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(authToken);
    const { id, evidenceId } = await params;

    const job = await prisma.job.findFirst({
      where: { id, OR: [{ clientId: user.id }, { providerId: user.id }] },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, jobId: job.id },
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
