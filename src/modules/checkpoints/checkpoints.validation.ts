import { z } from "zod";

export const checkpointStatusEnum = z.enum([
  "open",
  "closed",
  "delayed",
  "hazard",
  "unknown",
]);

export const createCheckpointSchema = z.object({
  name: z.string().min(2).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CreateCheckpointInput = z.infer<typeof createCheckpointSchema>;

export const setCheckpointStatusSchema = z.object({
  status: checkpointStatusEnum,
  note: z.string().max(2000).optional(),
});

export type SetCheckpointStatusInput = z.infer<typeof setCheckpointStatusSchema>;

export const listCheckpointsSchema = z.object({
  status: checkpointStatusEnum.optional(),
  q: z.string().max(255).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().max(50).optional(), // whitelist in repo
});

export type ListCheckpointsQuery = z.infer<typeof listCheckpointsSchema>;