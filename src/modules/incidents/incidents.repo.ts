import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../../db/mysql";

export type IncidentRow = RowDataPacket & {
  id: number;
  checkpoint_id: number | null;
  title: string;
  description: string;
  type: "closure" | "delay" | "accident" | "weather_hazard" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "verified" | "closed";
  start_time: Date;
  end_time: Date | null;
  created_by: number;
  verified_by: number | null;
  closed_by: number | null;
  created_at: Date;
  updated_at: Date | null;
};

async function logUpdate(incidentId: number, action: "created" | "updated" | "verified" | "closed", actorId: number) {
  // optional table, but you created it
  await pool.query(
    `INSERT INTO incident_updates (incident_id, action, actor_id)
     VALUES (?, ?, ?)`,
    [incidentId, action, actorId]
  );
}

export async function createIncident(input: {
  checkpointId?: number;
  title: string;
  description: string;
  type: IncidentRow["type"];
  severity: IncidentRow["severity"];
  startTime: string;
  createdBy: number;
}) {
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO incidents
      (checkpoint_id, title, description, type, severity, status, start_time, created_by)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
    [
      input.checkpointId ?? null,
      input.title,
      input.description,
      input.type,
      input.severity,
      input.startTime,
      input.createdBy,
    ]
  );

  await logUpdate(res.insertId, "created", input.createdBy);
  return res.insertId;
}

export async function getIncidentById(id: number) {
  const [rows] = await pool.query<IncidentRow[]>(
    `SELECT * FROM incidents WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateIncident(id: number, patch: any, actorId: number) {
  // build dynamic SET safely
  const sets: string[] = [];
  const values: any[] = [];

  const map: Record<string, string> = {
    checkpointId: "checkpoint_id",
    title: "title",
    description: "description",
    type: "type",
    severity: "severity",
  };

  for (const key of Object.keys(map)) {
    if (patch[key] !== undefined) {
      sets.push(`${map[key]} = ?`);
      values.push(key === "checkpointId" ? patch[key] : patch[key]);
    }
  }

  if (!sets.length) return;

  await pool.query(
    `UPDATE incidents SET ${sets.join(", ")} WHERE id = ?`,
    [...values, id]
  );

  await logUpdate(id, "updated", actorId);
}

export async function verifyIncident(id: number, actorId: number) {
  await pool.query(
    `UPDATE incidents
     SET status = 'verified', verified_by = ?
     WHERE id = ?`,
    [actorId, id]
  );
  await logUpdate(id, "verified", actorId);
}

export async function closeIncident(id: number, actorId: number) {
  await pool.query(
    `UPDATE incidents
     SET status = 'closed', closed_by = ?, end_time = NOW()
     WHERE id = ?`,
    [actorId, id]
  );
  await logUpdate(id, "closed", actorId);
}

export async function listIncidents(params: {
  status?: IncidentRow["status"];
  type?: IncidentRow["type"];
  severity?: IncidentRow["severity"];
  checkpointId?: number;
  from?: string;
  to?: string;
  q?: string;

  page: number;
  limit: number;
  sort?: string;
}) {
  const where: string[] = [];
  const values: any[] = [];

  if (params.status) {
    where.push(`status = ?`);
    values.push(params.status);
  }
  if (params.type) {
    where.push(`type = ?`);
    values.push(params.type);
  }
  if (params.severity) {
    where.push(`severity = ?`);
    values.push(params.severity);
  }
  if (params.checkpointId) {
    where.push(`checkpoint_id = ?`);
    values.push(params.checkpointId);
  }
  if (params.from) {
    where.push(`created_at >= ?`);
    values.push(params.from);
  }
  if (params.to) {
    where.push(`created_at <= ?`);
    values.push(params.to);
  }
  if (params.q) {
    where.push(`(title LIKE ? OR description LIKE ?)`);
    values.push(`%${params.q}%`, `%${params.q}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // sort whitelist
  const sortRaw = params.sort ?? "-created_at";
  const desc = sortRaw.startsWith("-");
  const field = desc ? sortRaw.slice(1) : sortRaw;

  const allowedSort = new Set(["created_at", "severity", "type", "status"]);
  const orderField = allowedSort.has(field) ? field : "created_at";
  const orderDir = desc ? "DESC" : "ASC";

  const offset = (params.page - 1) * params.limit;

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM incidents ${whereSql}`,
    values
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await pool.query<IncidentRow[]>(
    `SELECT *
     FROM incidents
     ${whereSql}
     ORDER BY ${orderField} ${orderDir}
     LIMIT ? OFFSET ?`,
    [...values, params.limit, offset]
  );

  return { rows, total };
}