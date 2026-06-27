import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Manually count related records (Supabase doesn't support Prisma-style include)
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (p: any) => {
        const [apiKeys, incidents, rules] = await Promise.all([
          db.apiKey.count({ where: { projectId: p.id } }),
          db.incident.count({ where: { projectId: p.id } }),
          db.rule.count({ where: { projectId: p.id } }),
        ]).catch(() => [0, 0, 0]);
        return { ...p, _count: { apiKeys, incidents, rules } };
      })
    );

    return NextResponse.json({ projects: projectsWithCounts });
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

    // Auto-create user if doesn't exist (self-bootstrapping)
    try {
      const existingUser = await db.user.findFirst({ where: { id: userId } });
      if (!existingUser) {
        await db.user.create({
          data: { id: userId, email: `${userId}@poly.dev`, role: "developer" },
        });
        console.log(`Auto-created user: ${userId}`);
      }
    } catch (e) {
      console.log("User lookup/create error (non-fatal):", e);
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
  } catch (error: any) {
    console.error("Create project error:", error?.message || error);
    return NextResponse.json({ error: `Failed to create project: ${error?.message || error}` }, { status: 500 });
  }
}
