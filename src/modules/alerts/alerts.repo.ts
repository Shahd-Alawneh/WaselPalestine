import pool from "../../db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from "./alerts.validation";

export type AlertSubscriptionRow = {
  id: number;
  user_id: number;
  area_type: "city" | "governorate" | "bbox";
  area_value: any;
  incident_category: string | null;
  is_active: 0 | 1;
  created_at: string;
};

function parseAreaValue(raw: any) {
  try {
    if (typeof raw === "string") return JSON.parse(raw);
    return raw;
  } catch {
    return raw;
  }
}

export async function createSubscription(
  userId: number,
  input: CreateSubscriptionInput
) {
  const areaValueJson = JSON.stringify(input.areaValue);

  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO alert_subscriptions (user_id, area_type, area_value, incident_category, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [userId, input.areaType, areaValueJson, input.incidentCategory ?? null]
  );

  return res.insertId;
}

export async function getSubscriptionsByUser(
  userId: number,
  opts: {
    page: number;
    limit: number;
    isActive?: boolean;
    areaType?: "city" | "governorate" | "bbox";
    incidentCategory?: string;
  }
) {
  // ✅ تأمين القيم (حل نهائي لمشكلة LIMIT/OFFSET)
  const safePage = Number.isFinite(Number(opts.page)) ? Math.max(1, Number(opts.page)) : 1;
  const safeLimit = Number.isFinite(Number(opts.limit)) ? Math.min(100, Math.max(1, Number(opts.limit))) : 20;
  const safeOffset = (safePage - 1) * safeLimit;

  if (!Number.isFinite(userId)) {
    const err: any = new Error("Invalid user id");
    err.status = 400;
    throw err;
  }

  const where: string[] = ["user_id = ?"];
  const params: any[] = [userId];

  if (opts.isActive !== undefined) {
    where.push("is_active = ?");
    params.push(opts.isActive ? 1 : 0);
  }

  if (opts.areaType) {
    where.push("area_type = ?");
    params.push(opts.areaType);
  }

  if (opts.incidentCategory) {
    where.push("(incident_category = ?)");
    params.push(opts.incidentCategory);
  }

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM alert_subscriptions WHERE ${where.join(" AND ")}`,
    params
  );
  const total = Number((countRows as any)[0]?.total ?? 0);

  // ✅ ملاحظة مهمة:
  // كثير بيئات mysql2 + MySQL بتطلع ER_WRONG_ARGUMENTS مع LIMIT ? OFFSET ?
  // فبنحطهم مباشرة بعد ما نضمن إنهم أرقام (safeLimit/safeOffset).
  const sql = `
    SELECT id, user_id, area_type, area_value, incident_category, is_active, created_at
    FROM alert_subscriptions
    WHERE ${where.join(" AND ")}
    ORDER BY id DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  const items = (rows as any[]).map((r) => ({
    ...r,
    area_value: parseAreaValue(r.area_value),
  })) as AlertSubscriptionRow[];

  return { total, items, page: safePage, limit: safeLimit };
}

export async function findSubscriptionById(id: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, user_id, area_type, area_value, incident_category, is_active, created_at
     FROM alert_subscriptions WHERE id = ? LIMIT 1`,
    [id]
  );
  const row = (rows as any)[0];
  if (!row) return null;

  return {
    ...row,
    area_value: parseAreaValue(row.area_value),
  } as AlertSubscriptionRow;
}

export async function updateSubscriptionById(
  id: number,
  input: UpdateSubscriptionInput
) {
  const fields: string[] = [];
  const params: any[] = [];

  if (input.areaType !== undefined) {
    fields.push("area_type = ?");
    params.push(input.areaType);
  }
  if (input.areaValue !== undefined) {
    fields.push("area_value = ?");
    params.push(JSON.stringify(input.areaValue));
  }
  if (input.incidentCategory !== undefined) {
    fields.push("incident_category = ?");
    params.push(input.incidentCategory ?? null);
  }
  if (input.isActive !== undefined) {
    fields.push("is_active = ?");
    params.push(input.isActive ? 1 : 0);
  }

  if (fields.length === 0) return;

  params.push(id);

  await pool.execute(
    `UPDATE alert_subscriptions SET ${fields.join(", ")} WHERE id = ?`,
    params
  );
}

export async function deleteSubscriptionById(id: number) {
  await pool.execute(`DELETE FROM alert_subscriptions WHERE id = ?`, [id]);
}

/**
 * Matching subscriptions for a verified incident.
 * We match by:
 * - category: subscription.incident_category is null => match any, else exact match
 * - area:
 *   - city/governorate: subscription.area_value.name equals incident city/governorate (case-insensitive)
 *   - bbox: incident lat/lng inside bbox
 */
export async function findMatchingSubscriptions(params: {
  incidentCategory: string;
  city?: string | null;
  governorate?: string | null;
  lat?: number | null;
  lng?: number | null;
}) {
  const { incidentCategory, city, governorate, lat, lng } = params;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, user_id, area_type, area_value, incident_category, is_active
     FROM alert_subscriptions
     WHERE is_active = 1
       AND (incident_category IS NULL OR incident_category = ?)`,
    [incidentCategory]
  );

  const subs = (rows as any[]).map((r) => ({
    ...r,
    area_value: parseAreaValue(r.area_value),
  })) as Array<{
    id: number;
    user_id: number;
    area_type: "city" | "governorate" | "bbox";
    area_value: any;
    incident_category: string | null;
    is_active: 0 | 1;
  }>;

  const cityNorm = (city ?? "").trim().toLowerCase();
  const govNorm = (governorate ?? "").trim().toLowerCase();

  const matched = subs.filter((s) => {
    if (s.area_type === "city") {
      const n = String(s.area_value?.name ?? "").trim().toLowerCase();
      return n && cityNorm && n === cityNorm;
    }
    if (s.area_type === "governorate") {
      const n = String(s.area_value?.name ?? "").trim().toLowerCase();
      return n && govNorm && n === govNorm;
    }
    if (s.area_type === "bbox") {
      if (lat == null || lng == null) return false;
      const b = s.area_value || {};
      const minLat = Number(b.minLat);
      const minLng = Number(b.minLng);
      const maxLat = Number(b.maxLat);
      const maxLng = Number(b.maxLng);
      if (![minLat, minLng, maxLat, maxLng].every((x) => Number.isFinite(x)))
        return false;
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    }
    return false;
  });

  return matched;
}

export async function createAlertRecords(
  subscriptionIds: number[],
  incidentId: number
) {
  if (subscriptionIds.length === 0) return 0;

  const values = subscriptionIds.map(() => "(?, ?, 'created')").join(", ");
  const params: any[] = [];
  for (const sid of subscriptionIds) {
    params.push(sid, incidentId);
  }

  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO alerts (subscription_id, incident_id, status) VALUES ${values}`,
    params
  );
  return res.affectedRows;
}
