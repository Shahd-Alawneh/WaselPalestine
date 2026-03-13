import type { Request, Response } from "express";
import { loginSchema, refreshSchema, registerSchema } from "./auth.validation";
import * as authService from "./auth.service";

function ok(res: Response, data: any) {
  return res.json({ success: true, data, error: null });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const data = await authService.register(input);
  return ok(res, data);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const data = await authService.login(input);
  return ok(res, data);
}

export async function refresh(req: Request, res: Response) {
  const input = refreshSchema.parse(req.body);
  const data = await authService.refresh(input.refreshToken);
  return ok(res, data);
}

export async function logout(req: Request, res: Response) {
  const input = refreshSchema.parse(req.body);
  const data = await authService.logout(input.refreshToken);
  return ok(res, data);
}