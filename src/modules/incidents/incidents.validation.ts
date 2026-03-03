import { z } from "zod";

export const incidentTypeEnum = z.enum([
  "closure",
  "delay",
  "accident",
  "weather_hazard",
  "other",
]);

export const incidentSeverityEnum = z.enum(["low", "medium", "high", "critical"]);
export const incidentStatusEnum = z.enum(["open", "verified", "closed"]);

export const createIncidentSchema = z.object({
  checkpointId: z.number().int().positive().optional(),
  title: z.string().min(2).max(255),
  description: z.string().min(2).max(5000),
  type: incidentTypeEnum,
  severity: incidentSeverityEnum,
  startTime: z.string().min(8), // accept "YYYY-MM-DD HH:mm:ss"
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = z.object({
  checkpointId: z.number().int().positive().nullable().optional(),
  title: z.string().min(2).max(255).optional(),
  description: z.string().min(2).max(5000).optional(),
  type: incidentTypeEnum.optional(),
  severity: incidentSeverityEnum.optional(),
});

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;

export const listIncidentsSchema = z.object({
  status: incidentStatusEnum.optional(),
  type: incidentTypeEnum.optional(),
  severity: incidentSeverityEnum.optional(),
  checkpointId: z.coerce.number().int().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().max(255).optional(),

  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().max(50).optional(),
});

export type ListIncidentsQuery = z.infer<typeof listIncidentsSchema>;