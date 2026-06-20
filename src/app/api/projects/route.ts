import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { apiKeys: true, incidents: true, rules: true } },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, userId } = await req.json();
    if (!name || !userId) {
      return NextResponse.json({ error: "name and userId are required" }, { status: 400 });
    }

    const project = await db.project.create({
      data: { name, description, userId },
    });

    // Create default rules for the project
    const defaultRules = [
      { type: "protected", field: "amount", action: "block" },
      { type: "protected", field: "price", action: "block" },
      { type: "protected", field: "currency", action: "block" },
      { type: "protected", field: "payment_status", action: "block" },
      { type: "protected", field: "auth_token", action: "block" },
      { type: "protected", field: "order_id", action: "block" },
      { type: "safe", field: "name", action: "allow" },
      { type: "safe", field: "description", action: "allow" },
      { type: "safe", field: "avatar", action: "allow" },
      { type: "safe", field: "address", action: "allow" },
      { type: "safe", field: "email", action: "allow" },
    ];

    await db.rule.createMany({
      data: defaultRules.map((r) => ({ ...r, projectId: project.id })),
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
