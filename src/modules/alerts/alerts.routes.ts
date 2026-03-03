import { Router } from "express";
import * as controller from "./alerts.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { requireRole } from "../../common/middlewares/requireRole";
const router = Router();

// Subscriptions CRUD
router.post("/subscriptions", requireAuth, controller.createSubscription);
router.get("/subscriptions", requireAuth, controller.listMySubscriptions);
router.patch("/subscriptions/:id", requireAuth, controller.updateSubscription);
router.delete("/subscriptions/:id", requireAuth, controller.deleteSubscription);
router.post("/test-trigger", requireAuth, requireRole(["admin", "moderator"]), controller.testTrigger);
export default router;
