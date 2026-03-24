import { Router } from "express";
import ReportsController from "./reports.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { rateLimitCreateReport } from "../../common/middlewares/rateLimitReports";
import { requireRole } from "../../common/middlewares/requireRole";
/**
 * @swagger
 * /api/v1/reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     bearerAuth: []
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - description
 *               - lat
 *               - lng
 *             properties:
 *               category:
 *                 type: string
 *                 example: ACCIDENT
 *               description:
 *                 type: string
 *                 example: Minor accident near checkpoint
 *               lat:
 *                 type: number
 *                 example: 31.529
 *               lng:
 *                 type: number
 *                 example: 35.189
 *     responses:
 *       201:
 *         description: Report created successfully
 *       401:
 *         description: Unauthorized
 */
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
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 example: APPROVE
 *               reason:
 *                 type: string
 *                 example: Verified by admin
 *     responses:
 *       200:
 *         description: Report moderated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/moderate", requireAuth, requireRole(["admin", "moderator"]), (req, res, next) =>
  controller.moderateReport(req, res, next)
);

export default router;