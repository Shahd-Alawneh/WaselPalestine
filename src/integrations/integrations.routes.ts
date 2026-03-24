import { Router } from "express";
import * as controller from "./integrations.controller";
import { requireAuth } from "../common/middlewares/requireAuth";

const router = Router();

// Weather endpoints
router.get("/weather", requireAuth, controller.getWeather);

// Road routing endpoints
router.post("/route", requireAuth, controller.getRoadRoute);

// Geocoding endpoints
router.get("/geocode", requireAuth, controller.geocodeAddress);
router.get("/reverse-geocode", requireAuth, controller.reverseGeocode);

export default router;