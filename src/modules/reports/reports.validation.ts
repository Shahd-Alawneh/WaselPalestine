import { z } from "zod";

export const createReportSchema = z.object({
  category: z.string().min(2).max(50),
  description: z.string().min(5).max(2000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  reportedAt: z.string().datetime().optional(),
});

// TODO: define vote request body validation.
export const voteReportSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

// TODO: define moderation request body validation.
export const moderateReportSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "MARK_SPAM"]),
  reason: z.string().max(500).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type VoteReportInput = z.infer<typeof voteReportSchema>;
export type ModerateReportInput = z.infer<typeof moderateReportSchema>;
