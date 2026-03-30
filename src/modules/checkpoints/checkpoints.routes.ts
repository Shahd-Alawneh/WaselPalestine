import { Router } from "express";
import * as controller from "./checkpoints.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { requireRole } from "../../common/middlewares/requireRole";

const router = Router();

/**
 * @swagger
 * /api/v1/checkpoints:
 *   get:
 *     summary: List checkpoints
 *     tags: [Checkpoints]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, delayed, hazard, unknown]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checkpoints list returned successfully
 */
router.get("/", controller.listCheckpoints);

/**
 * @swagger
 * /api/v1/checkpoints/{id}:
 *   get:
 *     summary: Get checkpoint by ID
 *     tags: [Checkpoints]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Checkpoint returned successfully
 *       404:
 *         description: Checkpoint not found
 */
router.get("/:id", controller.getCheckpoint);

/**
 * @swagger
 * /api/v1/checkpoints/{id}/history:
 *   get:
 *     summary: Get checkpoint status history
 *     tags: [Checkpoints]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Checkpoint history returned successfully
 */
router.get("/:id/history", controller.getCheckpointHistory);

/**
 * @swagger
 * /api/v1/checkpoints:
 *   post:
 *     summary: Create a checkpoint
 *     tags: [Checkpoints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCheckpointRequest'
 *     responses:
 *       201:
 *         description: Checkpoint created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", requireAuth, requireRole(["admin", "moderator"]), controller.createCheckpoint);

/**
 * @swagger
 * /api/v1/checkpoints/{id}/status:
 *   post:
 *     summary: Set checkpoint status
 *     tags: [Checkpoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Checkpoint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetCheckpointStatusRequest'
 *     responses:
 *       200:
 *         description: Checkpoint status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/:id/status",
  requireAuth,
  requireRole(["admin", "moderator"]),
  controller.setCheckpointStatus
);

export default router;