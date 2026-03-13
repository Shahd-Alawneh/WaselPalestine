import * as repo from "./incidents.repo";
import type { CreateIncidentInput, ListIncidentsQuery, UpdateIncidentInput } from "./incidents.validation";
import { onIncidentVerified } from "../alerts/alerts.service";
import { getCheckpoint } from "../checkpoints/checkpoints.service";
import { findNearestNode } from "../routes/routes.graph";

export async function createIncident(input: CreateIncidentInput, actorId: number) {
  const id = await repo.createIncident({ ...input, createdBy: actorId });
  const row = await repo.getIncidentById(id);
  return row;
}

export async function getIncident(id: number) {
  const row = await repo.getIncidentById(id);
  if (!row) {
    const err: any = new Error("Incident not found");
    err.status = 404;
    throw err;
  }
  return row;
}

export async function listIncidents(query: ListIncidentsQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const { rows, total } = await repo.listIncidents({
    status: query.status,
    type: query.type,
    severity: query.severity,
    checkpointId: query.checkpointId,
    from: query.from,
    to: query.to,
    q: query.q,
    page,
    limit,
    sort: query.sort,
  });

  return {
    data: rows,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      sort: query.sort ?? "-created_at",
      filters: {
        status: query.status,
        type: query.type,
        severity: query.severity,
        checkpointId: query.checkpointId,
        from: query.from,
        to: query.to,
        q: query.q,
      },
    },
  };
}

export async function updateIncident(id: number, patch: UpdateIncidentInput, actorId: number) {
  const existing = await getIncident(id);
  if (existing.status === "closed") {
    const err: any = new Error("Cannot update a closed incident");
    err.status = 409;
    throw err;
  }
  await repo.updateIncident(id, patch, actorId);
  return repo.getIncidentById(id);
}

export async function verifyIncident(id: number, actorId: number) {
  const existing = await getIncident(id);
  if (existing.status === "verified") {
    const err: any = new Error("Incident already verified");
    err.status = 409;
    throw err;
  }
  if (existing.status === "closed") {
    const err: any = new Error("Cannot verify a closed incident");
    err.status = 409;
    throw err;
  }
  await repo.verifyIncident(id, actorId);
  const updated = await repo.getIncidentById(id);

  if (updated && updated.checkpoint_id) {
    try {
      const cp = await getCheckpoint(updated.checkpoint_id);
      const lat = Number(cp.latitude);
      const lng = Number(cp.longitude);
      const nearest = findNearestNode(lat, lng);

      await onIncidentVerified({
        incidentId: updated.id,
        category: updated.type,
        city: nearest.name,
        governorate: nearest.governorate,
        lat,
        lng,
      });
    } catch (err) {
      console.error("[ALERT_TRIGGER_ERROR]", err);
    }
  }

  return updated;
}

export async function closeIncident(id: number, actorId: number) {
  const existing = await getIncident(id);
  if (existing.status === "closed") {
    const err: any = new Error("Incident already closed");
    err.status = 409;
    throw err;
  }
  await repo.closeIncident(id, actorId);
  return repo.getIncidentById(id);
}