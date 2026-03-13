import { z } from "zod";

// ─── Coordinate Schema ──────────────────────────────────────────────────────

const coordSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

const nameSchema = z.object({
    name: z.string().min(1).max(100),
});

const locationSchema = z.union([coordSchema, nameSchema]);

// ─── Bounding Box Schema ────────────────────────────────────────────────────

const bboxSchema = z.object({
    minLat: z.number().min(-90).max(90),
    minLng: z.number().min(-180).max(180),
    maxLat: z.number().min(-90).max(90),
    maxLng: z.number().min(-180).max(180),
});

// ─── Route Estimation Request ────────────────────────────────────────────────

export const estimateRouteSchema = z.object({
    origin: locationSchema,
    destination: locationSchema,
    avoidCheckpoints: z.boolean().optional().default(false),
    avoidAreas: z.array(bboxSchema).optional().default([]),
});

export type EstimateRouteInput = z.infer<typeof estimateRouteSchema>;
