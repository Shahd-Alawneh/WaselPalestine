import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../../db/mysql";

export type Role = "admin" | "moderator" | "citizen";

export type UserRow = RowDataPacket & {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: Role;
  is_active: number;
  created_at: Date;
};

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows.length ? rows[0] : null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length ? rows[0] : null;
}

export async function createUser(
  fullName: string,
  email: string,
  passwordHash: string
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES (?, ?, ?)`,
    [fullName, email, passwordHash]
  );

  return result.insertId;
}