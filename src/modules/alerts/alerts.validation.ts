import { z } from "zod";

const bboxSchema = z.object({
  minLat: z.number().min(-90).max(90),
  minLng: z.number().min(-180).max(180),
  maxLat: z.number().min(-90).max(90),
  maxLng: z.number().min(-180).max(180),
});

const citySchema = z.object({
  name: z.string().min(1).max(100),
});

const governorateSchema = z.object({
  name: z.string().min(1).max(100),
});

export const createSubscriptionSchema = z
  .object({
    areaType: z.enum(["city", "governorate", "bbox"]),
    areaValue: z.unknown(),
    incidentCategory: z.string().max(50).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.areaType === "bbox") {
      const parsed = bboxSchema.safeParse(val.areaValue);
      if (!parsed.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid bbox areaValue" });
      }
    } else if (val.areaType === "city") {
      const parsed = citySchema.safeParse(val.areaValue);
      if (!parsed.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid city areaValue" });
      }
    } else if (val.areaType === "governorate") {
      const parsed = governorateSchema.safeParse(val.areaValue);
      if (!parsed.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid governorate areaValue" });
      }
    }
  });

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z
  .object({
    areaType: z.enum(["city", "governorate", "bbox"]).optional(),
    areaValue: z.unknown().optional(),
    incidentCategory: z.string().max(50).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.areaType && val.areaValue !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If areaValue is provided, areaType must be provided too",
      });
      return;
    }
    if (!val.areaType) return;

    if (val.areaType === "bbox") {
      const parsed = bboxSchema.safeParse(val.areaValue);
      if (!parsed.success) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid bbox areaValue" });
    } else if (val.areaType === "city") {
      const parsed = citySchema.safeParse(val.areaValue);
      if (!parsed.success) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid city areaValue" });
    } else if (val.areaType === "governorate") {
      const parsed = governorateSchema.safeParse(val.areaValue);
      if (!parsed.success) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid governorate areaValue" });
    }
  });

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
