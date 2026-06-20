import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Create demo user
    const user = await db.user.upsert({
      where: { email: "demo@poly.dev" },
      update: {},
      create: { email: "demo@poly.dev", name: "Demo Developer", role: "developer" },
    });

    // Create demo project
    const project = await db.project.upsert({
      where: { id: "proj_demo_01" },
      update: {},
      create: {
        id: "proj_demo_01",
        name: "Stripe Integration",
        description: "Main Stripe API integration for payment processing",
        userId: user.id,
        status: "active",
      },
    });

    const project2 = await db.project.upsert({
      where: { id: "proj_demo_02" },
      update: {},
      create: {
        id: "proj_demo_02",
        name: "Shopify Store API",
        description: "Shopify product and order management",
        userId: user.id,
        status: "active",
      },
    });

    const project3 = await db.project.upsert({
      where: { id: "proj_demo_03" },
      update: {},
      create: {
        id: "proj_demo_03",
        name: "Slack Bot API",
        description: "Internal Slack bot for team notifications",
        userId: user.id,
        status: "active",
      },
    });

    // Create API keys
    await db.apiKey.upsert({
      where: { key: "poly_live_demo_stripe_key01" },
      update: {},
      create: { key: "poly_live_demo_stripe_key01", name: "Production Key", projectId: project.id, userId: user.id, status: "active" },
    });
    await db.apiKey.upsert({
      where: { key: "poly_live_demo_stripe_key02" },
      update: {},
      create: { key: "poly_live_demo_stripe_key02", name: "Staging Key", projectId: project.id, userId: user.id, status: "active" },
    });
    await db.apiKey.upsert({
      where: { key: "poly_live_demo_shopify_key01" },
      update: {},
      create: { key: "poly_live_demo_shopify_key01", name: "Production Key", projectId: project2.id, userId: user.id, status: "active" },
    });

    // Create default rules
    const ruleData = [
      { projectId: project.id, type: "protected", field: "amount", action: "block" },
      { projectId: project.id, type: "protected", field: "price", action: "block" },
      { projectId: project.id, type: "protected", field: "currency", action: "block" },
      { projectId: project.id, type: "protected", field: "payment_status", action: "block" },
      { projectId: project.id, type: "protected", field: "auth_token", action: "block" },
      { projectId: project.id, type: "protected", field: "order_id", action: "block" },
      { projectId: project.id, type: "safe", field: "name", action: "allow" },
      { projectId: project.id, type: "safe", field: "description", action: "allow" },
      { projectId: project.id, type: "safe", field: "avatar", action: "allow" },
      { projectId: project.id, type: "safe", field: "address", action: "allow" },
      { projectId: project.id, type: "safe", field: "email", action: "allow" },
      { projectId: project2.id, type: "protected", field: "amount", action: "block" },
      { projectId: project2.id, type: "protected", field: "price", action: "block" },
      { projectId: project2.id, type: "safe", field: "name", action: "allow" },
      { projectId: project2.id, type: "safe", field: "description", action: "allow" },
    ];

    for (const rd of ruleData) {
      const existing = await db.rule.findFirst({ where: { projectId: rd.projectId, field: rd.field, type: rd.type } });
      if (!existing) {
        await db.rule.create({ data: rd });
      }
    }

    // Create incidents
    const driftTypes = ["missing_field", "new_field", "type_change", "rename", "nullability", "enum_change"];
    const endpoints = [
      "/api/v1/customers",
      "/api/v1/charges",
      "/api/v1/refunds",
      "/api/v1/products",
      "/api/v1/orders",
      "/api/v1/invoices",
      "/api/v1/subscriptions",
      "/api/v1/payment_intents",
    ];
    const methods = ["GET", "POST", "PUT", "PATCH"];
    const severities: ("critical" | "high" | "medium" | "low")[] = ["critical", "high", "medium", "low"];
    const statuses: ("open" | "investigating" | "resolved" | "dismissed")[] = ["open", "investigating", "resolved", "dismissed"];

    for (let i = 0; i < 25; i++) {
      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 720)); // last 30 days
      const driftType = driftTypes[Math.floor(Math.random() * driftTypes.length)];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const confidence = Math.round((Math.random() * 60 + 40) * 100) / 100;
      const autoFixed = status === "resolved" && confidence > 98;

      const expectedFields = { name: "string", id: "string", amount: "number" };
      const actualFields = driftType === "rename"
        ? { full_name: "string", id: "string", amount: "number" }
        : driftType === "type_change"
        ? { name: "number", id: "string", amount: "number" }
        : driftType === "missing_field"
        ? { id: "string", amount: "number" }
        : { name: "string", id: "string", amount: "number", new_field: "string" };

      await db.incident.create({
        data: {
          projectId: [project.id, project2.id, project3.id][Math.floor(Math.random() * 3)],
          endpoint,
          method: methods[Math.floor(Math.random() * methods.length)],
          severity,
          driftType,
          expectedSchema: JSON.stringify(expectedFields),
          actualSchema: JSON.stringify(actualFields),
          confidence,
          status,
          autoFixed,
          createdAt,
          resolvedAt: status === "resolved" ? new Date(createdAt.getTime() + 3600000) : null,
        },
      });
    }

    // Create patch history
    const patchTypes = ["rename", "remove", "add_default", "type_conversion"];
    const fromPaths = [
      "user.profile.full_name", "customer.name", "item.description",
      "order.total", "user.avatar_url", "product.image",
      "address.line1", "payment.amount", "customer.email_address",
    ];

    for (let i = 0; i < 20; i++) {
      const patchType = patchTypes[Math.floor(Math.random() * patchTypes.length)];
      const from = fromPaths[Math.floor(Math.random() * fromPaths.length)];
      const to = patchType === "rename" ? from.replace("full_name", "name").replace("_url", "").replace("_address", "")
        : patchType === "remove" ? "" : from;
      const appliedAt = new Date();
      appliedAt.setHours(appliedAt.getHours() - Math.floor(Math.random() * 720));

      await db.patchHistory.create({
        data: {
          projectId: [project.id, project2.id][Math.floor(Math.random() * 2)],
          endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
          patchType,
          fromPath: from,
          toPath: to,
          confidence: Math.round((Math.random() * 40 + 60) * 100) / 100,
          success: Math.random() > 0.15,
          appliedAt,
          rolledBack: Math.random() > 0.85,
        },
      });
    }

    // Create usage metrics for last 30 days
    for (let d = 30; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);

      const baseRequests = 800 + Math.floor(Math.random() * 400);
      const driftRate = 0.02 + Math.random() * 0.06;

      for (const proj of [project.id, project2.id, project3.id]) {
        await db.usageMetric.upsert({
          where: { projectId_date: { projectId: proj, date } },
          create: {
            projectId: proj,
            date,
            requestsMonitored: baseRequests + Math.floor(Math.random() * 200),
            driftsDetected: Math.floor(baseRequests * driftRate),
            autoFixed: Math.floor(baseRequests * driftRate * (0.3 + Math.random() * 0.5)),
            aiCalls: Math.floor(baseRequests * driftRate * 0.6),
            cacheHits: Math.floor(baseRequests * 0.3),
            cacheMisses: Math.floor(baseRequests * 0.05),
          },
          update: {},
        });
      }
    }

    // Create alerts
    const alertEvents = [
      { type: "slack", channel: "https://hooks.slack.com/services/T00/B00/xxx", event: "critical_drift", message: "Critical schema drift detected on /api/v1/charges" },
      { type: "email", channel: "dev@company.com", event: "low_confidence", message: "Low confidence mapping for /api/v1/customers" },
      { type: "webhook", channel: "https://api.company.com/webhooks/poly", event: "patch_failure", message: "Patch application failed for /api/v1/refunds" },
      { type: "discord", channel: "https://discord.com/api/webhooks/xxx", event: "critical_drift", message: "Critical drift: payment_status type changed" },
    ];

    for (const alert of alertEvents) {
      await db.alert.create({
        data: {
          projectId: project.id,
          type: alert.type as "email" | "slack" | "discord" | "webhook",
          channel: alert.channel,
          event: alert.event as "critical_drift" | "patch_failure" | "low_confidence",
          message: alert.message,
          sent: Math.random() > 0.3,
        },
      });
    }

    // Create patch cache entries
    for (let i = 0; i < 8; i++) {
      await db.patchCache.create({
        data: {
          projectId: [project.id, project2.id][i % 2],
          cacheKey: `cache_${i}_${Date.now()}`,
          endpoint: endpoints[i % endpoints.length],
          method: "GET",
          host: "api.stripe.com",
          responseSignature: `sig_${i}`,
          patchData: JSON.stringify([{ type: "rename", from: "full_name", to: "name", confidence: 95 }]),
          confidence: 85 + Math.random() * 15,
          hitCount: Math.floor(Math.random() * 100),
          valid: true,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Database seeded with demo data" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database", details: String(error) }, { status: 500 });
  }
}
