import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../../db/mysql";

export type CheckpointRow = RowDataPacket & {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  current_status: "open" | "closed" | "delayed" | "hazard" | "unknown";
  created_at: Date;
  updated_at: Date | null;
};

export type CheckpointHistoryRow = RowDataPacket & {
  id: number;
  checkpoint_id: number;
  status: "open" | "closed" | "delayed" | "hazard" | "unknown";
  note: string | null;
  changed_by: number;
  changed_at: Date;
};

export async function createCheckpoint(input: {
  name: string;
  latitude: number;
  longitude: number;
}) {
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO checkpoints (name, latitude, longitude)
     VALUES (?, ?, ?)`,
    [input.name, input.latitude, input.longitude]
  );
  return res.insertId;
}

export async function getCheckpointById(id: number) {
  const [rows] = await pool.query<CheckpointRow[]>(
    `SELECT * FROM checkpoints WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function insertCheckpointStatus(input: {
  checkpointId: number;
  status: CheckpointRow["current_status"];
  note?: string;
  changedBy: number;
}) {
  await pool.query(
    `INSERT INTO checkpoint_status_history (checkpoint_id, status, note, changed_by)
     VALUES (?, ?, ?, ?)`,
    [input.checkpointId, input.status, input.note ?? null, input.changedBy]
  );

  await pool.query(
    `UPDATE checkpoints
     SET current_status = ?
     WHERE id = ?`,
    [input.status, input.checkpointId]
  );
}

export async function getCheckpointHistory(checkpointId: number) {
  const [rows] = await pool.query<CheckpointHistoryRow[]>(
    `SELECT *
     FROM checkpoint_status_history
     WHERE checkpoint_id = ?
     ORDER BY changed_at DESC`,
    [checkpointId]
  );
  return rows;
}

// list with filtering/sort/pagination
export async function listCheckpoints(params: {
  status?: CheckpointRow["current_status"];
  q?: string;
  page: number;
  limit: number;
  sort?: string;
}) {
  const where: string[] = [];
  const values: any[] = [];

  if (params.status) {
    where.push(`current_status = ?`);
    values.push(params.status);
  }

  if (params.q) {
    where.push(`name LIKE ?`);
    values.push(`%${params.q}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // sort whitelist
  const sortRaw = params.sort ?? "-created_at";
  const desc = sortRaw.startsWith("-");
  const field = desc ? sortRaw.slice(1) : sortRaw;

  const allowedSort = new Set(["created_at", "name", "current_status"]);
  const orderField = allowedSort.has(field) ? field : "created_at";
  const orderDir = desc ? "DESC" : "ASC";

  const offset = (params.page - 1) * params.limit;

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM checkpoints ${whereSql}`,
    values
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await pool.query<CheckpointRow[]>(
    `SELECT *
     FROM checkpoints
     ${whereSql}
     ORDER BY ${orderField} ${orderDir}
     LIMIT ? OFFSET ?`,
    [...values, params.limit, offset]
  );

  return { rows, total };
}