import { Router } from "express";
import ReportsController from "./reports.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { rateLimitCreateReport } from "../../common/middlewares/rateLimitReports";

const router = Router();
const controller = new ReportsController();

router.post("/", requireAuth, rateLimitCreateReport, (req, res, next) =>
  controller.createReport(req, res, next)
);
router.post("/:id/votes", requireAuth, (req, res, next) =>
  controller.voteReport(req, res, next)
);
router.get("/:id/votes/summary", requireAuth, (req, res, next) =>
  controller.getVoteSummary(req, res, next)
);
router.patch("/:id/moderate", requireAuth, (req, res, next) =>
  controller.moderateReport(req, res, next)
);

export default router;