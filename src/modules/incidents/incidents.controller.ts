import type { Request, Response } from "express";
import * as service from "./incidents.service";
import { createIncidentSchema, listIncidentsSchema, updateIncidentSchema } from "./incidents.validation";

function ok(res: Response, data: any) {
  return res.json({ success: true, data, error: null });
}

export async function createIncident(req: any, res: Response) {
  const input = createIncidentSchema.parse(req.body);
  const actorId = Number(req.user?.id ?? req.user?.sub);
  const data = await service.createIncident(input, actorId);
  return ok(res, data);
}

export async function listIncidents(req: Request, res: Response) {
  const query = listIncidentsSchema.parse(req.query);
  const data = await service.listIncidents(query);
  return ok(res, data);
}

export async function getIncident(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = await service.getIncident(id);
  return ok(res, data);
}

export async function updateIncident(req: any, res: Response) {
  const id = Number(req.params.id);
  const patch = updateIncidentSchema.parse(req.body);
  const actorId = Number(req.user?.id ?? req.user?.sub);
  const data = await service.updateIncident(id, patch, actorId);
  return ok(res, data);
}

export async function verifyIncident(req: any, res: Response) {
  const id = Number(req.params.id);
  const actorId = Number(req.user?.id ?? req.user?.sub);
  const data = await service.verifyIncident(id, actorId);
  return ok(res, data);
}

export async function closeIncident(req: any, res: Response) {
  const id = Number(req.params.id);
  const actorId = Number(req.user?.id ?? req.user?.sub);
  const data = await service.closeIncident(id, actorId);
  return ok(res, data);
}