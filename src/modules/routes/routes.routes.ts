import { Router } from "express";
import * as controller from "./routes.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";

const router = Router();

/**
 * @swagger
 * /api/v1/routes/estimate:
 *   post:
 *     summary: Estimate a route between origin and destination
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EstimateRouteRequest'
 *     responses:
 *       200:
 *         description: Route estimated successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/estimate", requireAuth, controller.estimateRoute);

/**
 * @swagger
 * /api/v1/routes/network:
 *   get:
 *     summary: Get available road network nodes
 *     tags: [Routes]
 *     security: []
 *     responses:
 *       200:
 *         description: Road network returned successfully
 */
router.get("/network", controller.getNetwork);

export default router;
