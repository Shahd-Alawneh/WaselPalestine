import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import ReportsService from "./reports.service";
import {
  createReportSchema,
  moderateReportSchema,
  voteReportSchema,
} from "./reports.validation";

type AuthenticatedRequest = Request & {
  user?: {
    id?: string | number;
    sub?: string;
    role?: string;
  };
};

export class ReportsController {
  private readonly service = new ReportsService();
  private readonly reportIdParamSchema = z.coerce.number().int().positive();

  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createReportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            details: parsed.error,
          },
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const rawUserId = authReq.user?.id ?? authReq.user?.sub;
      const userId = Number(rawUserId);

      if (!Number.isFinite(userId) || userId <= 0) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          },
        });
        return;
      }

      const createdReport = await this.service.createReport({
        userId,
        ...parsed.data,
      });

      res.status(201).json({ data: createdReport });
    } catch (error) {
      next(error);
    }
  }

  async voteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportIdParsed = this.reportIdParamSchema.safeParse(req.params.id);
      const bodyParsed = voteReportSchema.safeParse(req.body);

      if (!reportIdParsed.success || !bodyParsed.success) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            details: reportIdParsed.success ? bodyParsed.error : reportIdParsed.error,
          },
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const rawUserId = authReq.user?.id ?? authReq.user?.sub;
      const userId = Number(rawUserId);

      if (!Number.isFinite(userId) || userId <= 0) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          },
        });
        return;
      }

      const summary = await this.service.voteReport(
        reportIdParsed.data,
        userId,
        bodyParsed.data.value
      );

      res.status(200).json({ data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getVoteSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportIdParsed = this.reportIdParamSchema.safeParse(req.params.id);
      if (!reportIdParsed.success) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            details: reportIdParsed.error,
          },
        });
        return;
      }

      const summary = await this.service.getVoteSummary(reportIdParsed.data);
      res.status(200).json({ data: summary });
    } catch (error) {
      next(error);
    }
  }

  async moderateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportIdParsed = this.reportIdParamSchema.safeParse(req.params.id);
      const bodyParsed = moderateReportSchema.safeParse(req.body);

      if (!reportIdParsed.success || !bodyParsed.success) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            details: reportIdParsed.success ? bodyParsed.error : reportIdParsed.error,
          },
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const rawUserId = authReq.user?.id ?? authReq.user?.sub;
      const userId = Number(rawUserId);

      if (!Number.isFinite(userId) || userId <= 0) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          },
        });
        return;
      }

      const role = authReq.user?.role;
      // TODO: enforce moderator/admin role strictly when role claims are always present.
      if (role && role !== "admin" && role !== "moderator") {
        res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Forbidden",
          },
        });
        return;
      }

      const updatedReport = await this.service.moderateReport(
        reportIdParsed.data,
        userId,
        bodyParsed.data.action,
        bodyParsed.data.reason
      );

      res.status(200).json({ data: updatedReport });
    } catch (error) {
      next(error);
    }
  }
}

export default ReportsController;
