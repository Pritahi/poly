import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "poly_live_";
  for (let i = 0; i < 24; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const keys = await db.apiKey.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        key: true,
        name: true,
        projectId: true,
        status: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    // Mask keys for security
    const maskedKeys = keys.map((k) => ({
      ...k,
      key: k.key.slice(0, 15) + "..." + k.key.slice(-4),
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    console.error("API Keys error:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, projectId, userId } = await req.json();
    if (!name || !projectId || !userId) {
      return NextResponse.json({ error: "name, projectId, and userId are required" }, { status: 400 });
    }

    const key = generateApiKey();
    const apiKey = await db.apiKey.create({
      data: { key, name, projectId, userId },
    });

    return NextResponse.json({ apiKey }, { status: 201 });
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.apiKey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}
