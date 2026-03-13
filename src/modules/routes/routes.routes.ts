import { Router } from "express";
import * as controller from "./routes.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";

const router = Router();

// Estimate a route between two locations (requires auth)
router.post("/estimate", requireAuth, controller.estimateRoute);

// Get the available road network nodes (public – useful for frontend city pickers)
router.get("/network", controller.getNetwork);

export default router;
