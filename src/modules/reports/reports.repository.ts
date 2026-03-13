import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../../db/mysql";

export type ReportCreatePayload = {
  userId: number;
  category: string;
  description: string;
  lat: number;
  lng: number;
  gridKey: string;
  reportedAt: Date;
};
export type VoteCreatePayload = Record<string, unknown>;
export type ModerationAction = "APPROVE" | "REJECT" | "MARK_SPAM";
export type ModerateReportStatus = "APPROVED" | "REJECTED" | "SPAM";
export type ModerationLogPayload = {
  actor_user_id: number;
  action: ModerationAction;
  target_id: number;
  reason?: string;
  before_snapshot?: string | null;
  after_snapshot?: string | null;
};
export type VoteValue = 1 | -1;
export type VoteSummary = {
  upvotes: number;
  downvotes: number;
  score: number;
};
export type VoteCounts = {
  upvotes: number;
  downvotes: number;
};

export type ReportRow = RowDataPacket & {
  id: number;
  user_id: number;
  category: string;
  description: string;
  lat: number;
  lng: number;
  grid_key: string;
  reported_at: Date;
  created_at: Date;
  status: "PENDING" | "APPROVED" | "REJECTED" | "MERGED" | "SPAM";
  duplicate_of_report_id: number | null;
  confidence_score: number;
  source_ip_hash: string | null;
};

export class ReportsRepository {
  async createReport(data: ReportCreatePayload): Promise<ReportRow> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO reports (
        user_id, category, description, lat, lng, grid_key, reported_at, status, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 50)`,
      [
        data.userId,
        data.category,
        data.description,
        data.lat,
        data.lng,
        data.gridKey,
        data.reportedAt,
      ]
    );

    const [rows] = await pool.query<ReportRow[]>(
      "SELECT * FROM reports WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    if (!rows.length) {
      throw new Error("Failed to fetch created report");
    }

    return rows[0];
  }

  async findById(reportId: number): Promise<ReportRow | null> {
    const [rows] = await pool.query<ReportRow[]>(
      "SELECT * FROM reports WHERE id = ? LIMIT 1",
      [reportId]
    );
    return rows.length ? rows[0] : null;
  }

  async getReportByIdForUpdate(reportId: number): Promise<ReportRow | null> {
    // Kept simple for now; can be upgraded to SELECT ... FOR UPDATE inside transactions later.
    return this.findById(reportId);
  }

  async findDuplicateCandidate(
    category: string,
    gridKey: string,
    reportedAt: Date,
    windowMinutes: number,
    excludeId: number
  ): Promise<ReportRow | null> {
    // Primary reports in active states from the previous time window only.
    const [rows] = await pool.query<ReportRow[]>(
      `SELECT *
       FROM reports
       WHERE category = ?
         AND grid_key = ?
         AND reported_at BETWEEN DATE_SUB(?, INTERVAL ? MINUTE) AND ?
         AND duplicate_of_report_id IS NULL
         AND status IN ('PENDING', 'APPROVED')
         AND id <> ?
       ORDER BY reported_at DESC
       LIMIT 1`,
      [category, gridKey, reportedAt, windowMinutes, reportedAt, excludeId]
    );

    return rows.length ? rows[0] : null;
  }

  async markReportMergedAsDuplicate(newId: number, candidateId: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE reports
       SET status = 'MERGED',
           duplicate_of_report_id = ?,
           confidence_score = 0
       WHERE id = ?`,
      [candidateId, newId]
    );
  }

  async incrementConfidence(reportId: number, delta: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE reports
       SET confidence_score = LEAST(100, confidence_score + ?)
       WHERE id = ?`,
      [delta, reportId]
    );
  }

  async upsertVote(reportId: number, userId: number, value: VoteValue): Promise<void> {
    await pool.query<ResultSetHeader>(
      `INSERT INTO votes (report_id, user_id, value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [reportId, userId, value]
    );
  }

  async getVoteCounts(reportId: number): Promise<VoteCounts> {
    type VoteCountsRow = RowDataPacket & {
      upvotes: number | string | null;
      downvotes: number | string | null;
    };

    const [rows] = await pool.query<VoteCountsRow[]>(
      `SELECT
         COALESCE(SUM(value = 1), 0) AS upvotes,
         COALESCE(SUM(value = -1), 0) AS downvotes
       FROM votes
       WHERE report_id = ?`,
      [reportId]
    );

    return {
      upvotes: Number(rows[0].upvotes ?? 0),
      downvotes: Number(rows[0].downvotes ?? 0),
    };
  }

  async getReportConfidence(reportId: number): Promise<number> {
    type ReportConfidenceRow = RowDataPacket & {
      confidence_score: number | string;
    };

    const [rows] = await pool.query<ReportConfidenceRow[]>(
      "SELECT confidence_score FROM reports WHERE id = ? LIMIT 1",
      [reportId]
    );

    if (!rows.length) {
      const err: Error & { status?: number } = new Error("Report not found");
      err.status = 404;
      throw err;
    }

    return Number(rows[0].confidence_score);
  }

  async updateReportConfidence(reportId: number, score: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      "UPDATE reports SET confidence_score = ? WHERE id = ?",
      [score, reportId]
    );
  }

  async updateReportStatus(reportId: number, newStatus: ModerateReportStatus): Promise<void> {
    await pool.query<ResultSetHeader>(
      "UPDATE reports SET status = ? WHERE id = ?",
      [newStatus, reportId]
    );
  }

  async insertModerationLog(payload: ModerationLogPayload): Promise<void> {
    await pool.query<ResultSetHeader>(
      `INSERT INTO moderation_logs
        (actor_user_id, action, target_type, target_id, reason, before_json, after_json)
       VALUES (?, ?, 'REPORT', ?, ?, ?, ?)`,
      [
        payload.actor_user_id,
        payload.action,
        payload.target_id,
        payload.reason ?? null,
        payload.before_snapshot ?? null,
        payload.after_snapshot ?? null,
      ]
    );
  }
}

export default ReportsRepository;
