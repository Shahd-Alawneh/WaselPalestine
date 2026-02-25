import crypto from "crypto";
import pool from "../../db/mysql";
import { hashPassword, verifyPassword } from "../../common/utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt";
import { createUser, findUserByEmail } from "./auth.repo";
import type { LoginInput, RegisterInput } from "./auth.validation";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function register(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    const err: any = new Error("Email already exists");
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(input.password);
  const userId = await createUser(input.fullName, input.email, passwordHash);

  const payload = { sub: String(userId), role: "citizen" as const };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // store refresh token hash
  const tokenHash = sha256(refreshToken);
  const expiresAt = addDays(new Date(), 7); // matches default 7d

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );

  return {
    user: { id: userId, fullName: input.fullName, email: input.email, role: "citizen" },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    const err: any = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const ok = await verifyPassword(input.password, user.password_hash);
  if (!ok) {
    const err: any = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  if (user.is_active === 0) {
    const err: any = new Error("User is inactive");
    err.status = 403;
    throw err;
  }

  const payload = { sub: String(user.id), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const tokenHash = sha256(refreshToken);
  const expiresAt = addDays(new Date(), 7);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, tokenHash, expiresAt]
  );

  return {
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

export async function refresh(refreshToken: string) {
  // verify JWT signature first
  const payload = verifyRefreshToken(refreshToken);

  const userId = Number(payload.sub);
  const tokenHash = sha256(refreshToken);

  // ensure token exists + not revoked + not expired
  const [rows]: any = await pool.query(
    `SELECT id, user_id, expires_at, revoked_at
     FROM refresh_tokens
     WHERE user_id = ? AND token_hash = ? LIMIT 1`,
    [userId, tokenHash]
  );

  const row = rows?.[0];
  if (!row) {
    const err: any = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }

  if (row.revoked_at) {
    const err: any = new Error("Refresh token revoked");
    err.status = 401;
    throw err;
  }

  const expires = new Date(row.expires_at);
  if (expires.getTime() < Date.now()) {
    const err: any = new Error("Refresh token expired");
    err.status = 401;
    throw err;
  }

  // rotate: revoke old, issue new
  await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?`, [
    row.id,
  ]);

  const newPayload = { sub: String(userId), role: payload.role };
  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  const newHash = sha256(newRefreshToken);
  const newExpiresAt = addDays(new Date(), 7);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, newHash, newExpiresAt]
  );

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const userId = Number(payload.sub);
    const tokenHash = sha256(refreshToken);

    await pool.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL`,
      [userId, tokenHash]
    );
  } catch {
    // ignore invalid token
  }

  return { ok: true };
}