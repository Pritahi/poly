import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const rules = await db.rule.findMany({ where, orderBy: { createdAt: "desc" } });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Rules API error:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, type, field, action } = await req.json();
    if (!projectId || !type || !field || !action) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const rule = await db.rule.create({
      data: { projectId, type, field, action },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Create rule error:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.rule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete rule error:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
