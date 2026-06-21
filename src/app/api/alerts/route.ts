import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const alerts = await db.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Alerts API error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, type, channel, event, message } = await req.json();
    if (!projectId || !type || !channel || !event) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const alert = await db.alert.create({
      data: { projectId, type, channel, event, message: message || `${event} alert`, sent: false },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error("Create alert error:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
