import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [incidents, total] = await Promise.all([
      db.incident.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.incident.count({ where }),
    ]);

    return NextResponse.json({ incidents, total, page, limit });
  } catch (error) {
    console.error("Incidents API error:", error);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const incident = await db.incident.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === "resolved" ? new Date() : undefined,
      },
    });

    return NextResponse.json({ incident });
  } catch (error) {
    console.error("Update incident error:", error);
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }
}
