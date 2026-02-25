import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export type Role = "admin" | "moderator" | "citizen";

export type JwtPayload = {
  sub: string;
  role: Role;
};

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET || "change_me_access";
const REFRESH_SECRET: Secret =
  process.env.JWT_REFRESH_SECRET || "change_me_refresh";

// لاحظي: بنحوّل expiresIn لنوع SignOptions["expiresIn"] عشان TS يرضى
const ACCESS_EXPIRES = (process.env.JWT_ACCESS_EXPIRES || "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRES = (process.env.JWT_REFRESH_EXPIRES || "7d") as SignOptions["expiresIn"];

export function signAccessToken(payload: JwtPayload) {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

export function signRefreshToken(payload: JwtPayload) {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
