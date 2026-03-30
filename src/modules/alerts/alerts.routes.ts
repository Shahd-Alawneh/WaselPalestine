import { Router } from "express";
import * as controller from "./alerts.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { requireRole } from "../../common/middlewares/requireRole";

const router = Router();

/**
 * @swagger
 * /api/v1/alerts/subscriptions:
 *   post:
 *     summary: Create a new alert subscription
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriptionRequest'
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/subscriptions", requireAuth, controller.createSubscription);

/**
 * @swagger
 * /api/v1/alerts/subscriptions:
 *   get:
 *     summary: List current user's subscriptions
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/subscriptions", requireAuth, controller.listMySubscriptions);

/**
 * @swagger
 * /api/v1/alerts/subscriptions/{id}:
 *   patch:
 *     summary: Update an alert subscription
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch("/subscriptions/:id", requireAuth, controller.updateSubscription);

/**
 * @swagger
 * /api/v1/alerts/subscriptions/{id}:
 *   delete:
 *     summary: Delete an alert subscription
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/subscriptions/:id", requireAuth, controller.deleteSubscription);

/**
 * @swagger
 * /api/v1/alerts:
 *   get:
 *     summary: List current user's alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, controller.listMyAlerts);

/**
 * @swagger
 * /api/v1/alerts/test-trigger:
 *   post:
 *     summary: Trigger alert generation manually for testing
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test trigger executed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/test-trigger",
  requireAuth,
  requireRole(["admin", "moderator"]),
  controller.testTrigger
);

export default router;
