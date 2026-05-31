import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, providerId: user.id },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const body = await req.json();
    const { fileName, fileType, fileData, description, milestoneId } = body;

    if (!fileName || !fileType || !fileData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const buffer = Buffer.from(fileData, "base64");
    if (buffer.length > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 6MB)" }, { status: 400 });
    }

    const evidence = await prisma.evidence.create({
      data: {
        jobId: job.id,
        milestoneId: milestoneId || null,
        fileName,
        fileType,
        fileSize: buffer.length,
        data: buffer,
        description: description || null,
        uploadedById: user.id,
      },
    });

    return NextResponse.json({
      id: evidence.id,
      fileName: evidence.fileName,
      fileType: evidence.fileType,
      fileSize: evidence.fileSize,
      description: evidence.description,
      createdAt: evidence.createdAt,
    }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, OR: [{ clientId: user.id }, { providerId: user.id }] },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const evidence = await prisma.evidence.findMany({
      where: { jobId: job.id },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        description: true,
        milestoneId: true,
        createdAt: true,
        uploadedById: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(evidence);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
