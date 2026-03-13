import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import crypto from "crypto";

export type Role = "admin" | "moderator" | "citizen";

export type JwtPayload = {
  sub: string;
  role: Role;
};

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET || "change_me_access";
const REFRESH_SECRET: Secret =
  process.env.JWT_REFRESH_SECRET || "change_me_refresh";

const ACCESS_EXPIRES = (process.env.JWT_ACCESS_EXPIRES || "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRES = (process.env.JWT_REFRESH_EXPIRES || "7d") as SignOptions["expiresIn"];

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload: JwtPayload) {
  const jti = crypto.randomUUID();

  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
    jwtid: jti,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
