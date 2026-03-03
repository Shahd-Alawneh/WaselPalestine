import type { Response } from "express";
import type { AuthRequest } from "../../common/middlewares/requireAuth";
import { createSubscriptionSchema, updateSubscriptionSchema } from "./alerts.validation";
import * as service from "./alerts.service";
import { onIncidentVerified } from "./alerts.service";

function getUserId(req: AuthRequest) {
  const sub = req.user?.sub;
  const userId = Number(sub);
  if (!sub || !Number.isFinite(userId)) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return userId;
}

export async function createSubscription(req: AuthRequest, res: Response) {
  const userId = getUserId(req);
  const input = createSubscriptionSchema.parse(req.body);

  const created = await service.createSubscription(userId, input);
  res.status(201).json({ subscription: created });
}

export async function listMySubscriptions(req: AuthRequest, res: Response) {
  const userId = getUserId(req);

  // ✅ تحويل page/limit لأرقام بشكل مضمون
  const page = Number.isFinite(Number(req.query.page)) ? Math.max(1, Number(req.query.page)) : 1;
  const limit = Number.isFinite(Number(req.query.limit)) ? Math.min(100, Math.max(1, Number(req.query.limit))) : 20;

  const data = await service.listMySubscriptions(userId, {
    page,
    limit,
    isActive: req.query.isActive as any,
    areaType: req.query.areaType as any,
    incidentCategory: req.query.incidentCategory as any,
  });

  res.json({
    page,
    limit,
    total: data.total,
    items: data.items,
  });
}

export async function updateSubscription(req: AuthRequest, res: Response) {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const input = updateSubscriptionSchema.parse(req.body);
  const updated = await service.updateMySubscription(userId, id, input);
  res.json({ subscription: updated });
}

export async function deleteSubscription(req: AuthRequest, res: Response) {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const result = await service.deleteMySubscription(userId, id);
  res.json(result);
}

export async function testTrigger(req: AuthRequest, res: Response) {
  // نخليها ثابتة وبسيطة، وبنفس الوقت قابلة للتعديل من body إذا بدك
  const body = req.body || {};

  const incidentId = Number(body.incidentId ?? 999);
  const category = String(body.category ?? "checkpoint");
  const city = body.city ?? "Ramallah";
  const governorate = body.governorate ?? null;
  const lat = body.lat ?? null;
  const lng = body.lng ?? null;

  const result = await onIncidentVerified({
    incidentId,
    category,
    city,
    governorate,
    lat,
    lng,
  });

  res.json({
    ok: true,
    simulatedIncident: { incidentId, category, city, governorate, lat, lng },
    result,
  });
}
