import { Router } from "express";
import ReportsController from "./reports.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { rateLimitCreateReport } from "../../common/middlewares/rateLimitReports";
import { requireRole } from "../../common/middlewares/requireRole";

const router = Router();
const controller = new ReportsController();

/**
 * @swagger
 * /api/v1/reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportRequest'
 *     responses:
 *       201:
 *         description: Report created successfully
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 */
router.post("/", requireAuth, rateLimitCreateReport, (req, res, next) =>
  controller.createReport(req, res, next)
);

/**
 * @swagger
 * /api/v1/reports/{id}/votes:
 *   post:
 *     summary: Vote on a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoteReportRequest'
 *     responses:
 *       200:
 *         description: Vote submitted successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
router.post("/:id/votes", requireAuth, (req, res, next) =>
  controller.voteReport(req, res, next)
);

/**
 * @swagger
 * /api/v1/reports/{id}/votes/summary:
 *   get:
 *     summary: Get report vote summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Vote summary returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/:id/votes/summary", requireAuth, (req, res, next) =>
  controller.getVoteSummary(req, res, next)
);

/**
 * @swagger
 * /api/v1/reports/{id}/moderate:
 *   patch:
 *     summary: Moderate a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModerateReportRequest'
 *     responses:
 *       200:
 *         description: Report moderated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
  "/:id/moderate",
  requireAuth,
  requireRole(["admin", "moderator"]),
  (req, res, next) => controller.moderateReport(req, res, next)
);

export default router;