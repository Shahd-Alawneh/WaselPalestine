import { Router } from "express";
import * as controller from "./integrations.controller";
import { requireAuth } from "../common/middlewares/requireAuth";

const router = Router();

/**
 * @swagger
 * /api/v1/integrations/weather:
 *   get:
 *     summary: Get weather data for a location
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: false
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: false
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: city
 *         required: false
 *         schema:
 *           type: string
 *         description: City name
 *     responses:
 *       200:
 *         description: Weather data returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/weather", requireAuth, controller.getWeather);

/**
 * @swagger
 * /api/v1/integrations/route:
 *   post:
 *     summary: Get road route from external routing service
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               origin:
 *                 type: object
 *                 example:
 *                   lat: 31.529
 *                   lng: 35.189
 *               destination:
 *                 type: object
 *                 example:
 *                   lat: 31.9038
 *                   lng: 35.2034
 *     responses:
 *       200:
 *         description: Route returned successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/route", requireAuth, controller.getRoadRoute);

/**
 * @swagger
 * /api/v1/integrations/geocode:
 *   get:
 *     summary: Geocode an address into coordinates
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Address or place name
 *     responses:
 *       200:
 *         description: Geocoding result returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/geocode", requireAuth, controller.geocodeAddress);

/**
 * @swagger
 * /api/v1/integrations/reverse-geocode:
 *   get:
 *     summary: Reverse geocode coordinates into an address
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Reverse geocoding result returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/reverse-geocode", requireAuth, controller.reverseGeocode);

export default router;
