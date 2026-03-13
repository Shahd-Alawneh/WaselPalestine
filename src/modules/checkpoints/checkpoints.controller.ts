import type { Request, Response } from "express";
import * as service from "./checkpoints.service";
import {
  createCheckpointSchema,
  listCheckpointsSchema,
  setCheckpointStatusSchema,
} from "./checkpoints.validation";

function ok(res: Response, data: any) {
  return res.json({ success: true, data, error: null });
}

export async function createCheckpoint(req: Request, res: Response) {
  const input = createCheckpointSchema.parse(req.body);
  const data = await service.createCheckpoint(input);
  return ok(res, data);
}

export async function listCheckpoints(req: Request, res: Response) {
  const query = listCheckpointsSchema.parse(req.query);
  const data = await service.listCheckpoints(query);
  return ok(res, data);
}

export async function getCheckpoint(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = await service.getCheckpoint(id);
  return ok(res, data);
}

export async function setCheckpointStatus(req: any, res: Response) {
  const checkpointId = Number(req.params.id);
  const body = setCheckpointStatusSchema.parse(req.body);
  const actorId = Number(req.user?.id ?? req.user?.sub); // depends on your requireAuth payload

  const data = await service.setCheckpointStatus({ checkpointId, body, actorId });
  return ok(res, data);
}

export async function getCheckpointHistory(req: Request, res: Response) {
  const checkpointId = Number(req.params.id);
  const data = await service.getCheckpointHistory(checkpointId);
  return ok(res, data);
}