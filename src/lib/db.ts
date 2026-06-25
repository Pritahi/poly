import { supabase } from "./supabase";

// ==========================================
// Supabase-based DB wrapper with Prisma-like API
// ==========================================

type Filter = Record<string, any>;

// Helper: apply a where clause with operator support (eq, gte, lte, gt, lt)
function applyWhere(query: any, key: string, value: any): any {
  if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
    // Operator object: { gte: Date } or { lt: number }
    for (const [op, opVal] of Object.entries(value)) {
      const v = opVal instanceof Date ? opVal.toISOString() : opVal;
      switch (op) {
        case "gte": query = query.gte(key, v); break;
        case "lte": query = query.lte(key, v); break;
        case "gt": query = query.gt(key, v); break;
        case "lt": query = query.lt(key, v); break;
        case "neq": query = query.neq(key, v); break;
        default: query = query.eq(key, value); // fallback
      }
    }
  } else {
    const v = value instanceof Date ? value.toISOString() : value;
    query = query.eq(key, v);
  }
  return query;
}

async function findMany(table: string, options?: { where?: Filter; orderBy?: Record<string, string>; take?: number }) {
  let query = supabase.from(table).select("*");
  if (options?.where) {
    Object.entries(options.where).forEach(([key, value]) => {
      query = applyWhere(query, key, value);
    });
  }
  if (options?.orderBy) {
    Object.entries(options.orderBy).forEach(([col, dir]) => {
      query = dir === "asc" ? query.order(col, { ascending: true }) : query.order(col, { ascending: false });
    });
  }
  if (options?.take) {
    query = query.limit(options.take);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function count(table: string, where?: Filter) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (where) {
    Object.entries(where).forEach(([key, value]) => {
      query = applyWhere(query, key, value);
    });
  }
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function create(table: string, data: any) {
  const { data: result, error } = await supabase.from(table).insert(data).select().single();
  if (error) throw error;
  return result;
}

async function createMany(table: string, data: any[]) {
  const { data: result, error } = await supabase.from(table).insert(data).select();
  if (error) throw error;
  return result;
}

async function update(table: string, where: Filter, data: any) {
  let query = supabase.from(table).update(data).select().single();
  Object.entries(where).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data: result, error } = await query;
  if (error) throw error;
  return result;
}

async function remove(table: string, where: Filter) {
  let query = supabase.from(table).delete();
  Object.entries(where).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { error } = await query;
  if (error) throw error;
}

async function findFirst(table: string, where: Filter) {
  let query = supabase.from(table).select("*").limit(1).single();
  Object.entries(where).forEach(([key, value]) => {
    query = applyWhere(query, key, value);
  });
  const { data, error } = await query;
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function upsert(table: string, data: any) {
  const { data: result, error } = await supabase.from(table).upsert(data).select().single();
  if (error) throw error;
  return result;
}

async function groupBy(table: string, column: string) {
  const { data, error } = await supabase.from(table).select(column);
  if (error) throw error;
  const counts: Record<string, number> = {};
  data?.forEach((row: any) => {
    const val = row[column];
    counts[val] = (counts[val] || 0) + 1;
  });
  // Return Prisma-compatible format: [{column: "val", _count: {column: N}}]
  return Object.entries(counts).map(([key, count]) => ({
    [column]: key,
    _count: { [column]: count },
  }));
}

// ==========================================
// Typed model builders matching Prisma's API
// ==========================================

function model(name: string) {
  return {
    findMany: (options?: any) => findMany(name, options),
    findFirst: async (options?: { where?: Filter }) => {
      return findFirst(name, options?.where || {});
    },
    count: (options?: { where?: Filter }) => {
      return count(name, options?.where);
    },
    create: (options: { data: any }) => {
      return create(name, options.data);
    },
    createMany: (options: { data: any[] }) => {
      return createMany(name, options.data);
    },
    update: (options: { where: Filter; data: any }) => {
      return update(name, options.where, options.data);
    },
    delete: (options: { where: Filter }) => {
      return remove(name, options.where);
    },
    upsert: (options: { where: Filter; create: any; update: any }) => {
      return upsert(name, { ...options.where, ...options.create, ...options.update });
    },
    groupBy: (options: { by: string[] }) => {
      return groupBy(name, options.by[0]);
    },
  };
}

// ==========================================
// DB export — same API as PrismaClient
// ==========================================

export const db = {
  user: model("User"),
  project: model("Project"),
  apiKey: model("ApiKey"),
  rule: model("Rule"),
  incident: model("Incident"),
  patchHistory: model("PatchHistory"),
  patchCache: model("PatchCache"),
  alert: model("Alert"),
  usageMetric: model("UsageMetric"),
};
