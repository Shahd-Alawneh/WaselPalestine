import * as repo from "./checkpoints.repo";
import type {
  CreateCheckpointInput,
  ListCheckpointsQuery,
  SetCheckpointStatusInput,
} from "./checkpoints.validation";

export async function createCheckpoint(input: CreateCheckpointInput) {
  const id = await repo.createCheckpoint(input);
  const row = await repo.getCheckpointById(id);
  return row;
}

export async function getCheckpoint(id: number) {
  const row = await repo.getCheckpointById(id);
  if (!row) {
    const err: any = new Error("Checkpoint not found");
    err.status = 404;
    throw err;
  }
  return row;
}

export async function listCheckpoints(query: ListCheckpointsQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const { rows, total } = await repo.listCheckpoints({
    status: query.status,
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
      filters: { status: query.status, q: query.q },
    },
  };
}

export async function setCheckpointStatus(input: {
  checkpointId: number;
  body: SetCheckpointStatusInput;
  actorId: number;
}) {
  const exists = await repo.getCheckpointById(input.checkpointId);
  if (!exists) {
    const err: any = new Error("Checkpoint not found");
    err.status = 404;
    throw err;
  }

  await repo.insertCheckpointStatus({
    checkpointId: input.checkpointId,
    status: input.body.status,
    note: input.body.note,
    changedBy: input.actorId,
  });

  return repo.getCheckpointById(input.checkpointId);
}

export async function getCheckpointHistory(checkpointId: number) {
  // ensure exists
  await getCheckpoint(checkpointId);
  return repo.getCheckpointHistory(checkpointId);
}