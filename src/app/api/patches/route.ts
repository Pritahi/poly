import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const [patches, total] = await Promise.all([
      db.patchHistory.findMany({
        where,
        orderBy: { appliedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.patchHistory.count({ where }),
    ]);

    return NextResponse.json({ patches, total, page, limit });
  } catch (error) {
    console.error("Patches API error:", error);
    return NextResponse.json({ error: "Failed to fetch patches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, action } = await req.json();

    if (action === "rollback" && id) {
      const patch = await db.patchHistory.update({
        where: { id },
        data: { rolledBack: true },
      });
      return NextResponse.json({ patch, rolledBack: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Patch action error:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
