import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientAccessToken } from "@/lib/security/tokens";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { jobId } = verifyClientAccessToken(token);

    const evidence = await prisma.evidence.findMany({
      where: { jobId },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        description: true,
        milestoneId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(evidence);
  } catch {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  }
}
