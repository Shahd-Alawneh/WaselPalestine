import { Router } from "express";
import * as controller from "./incidents.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { requireRole } from "../../common/middlewares/requireRole";

const router = Router();

/**
 * @swagger
 * /api/v1/incidents:
 *   get:
 *     summary: List incidents
 *     tags: [Incidents]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, verified, closed]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [closure, delay, accident, weather_hazard, other]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: checkpointId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
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
 *         description: Incidents list returned successfully
 */
router.get("/", controller.listIncidents);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Get incident by ID
 *     tags: [Incidents]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident returned successfully
 *       404:
 *         description: Incident not found
 */
router.get("/:id", controller.getIncident);

/**
 * @swagger
 * /api/v1/incidents:
 *   post:
 *     summary: Create a new incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateIncidentRequest'
 *     responses:
 *       201:
 *         description: Incident created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", requireAuth, requireRole(["admin", "moderator"]), controller.createIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   patch:
 *     summary: Update incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateIncidentRequest'
 *     responses:
 *       200:
 *         description: Incident updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch("/:id", requireAuth, requireRole(["admin", "moderator"]), controller.updateIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}/verify:
 *   post:
 *     summary: Verify incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident verified successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/:id/verify", requireAuth, requireRole(["admin", "moderator"]), controller.verifyIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}/close:
 *   post:
 *     summary: Close incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident closed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/:id/close", requireAuth, requireRole(["admin", "moderator"]), controller.closeIncident);

export default router;