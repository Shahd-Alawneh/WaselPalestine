import { Router } from "express";
import * as controller from "./incidents.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { requireRole } from "../../common/middlewares/requireRole";

const router = Router();

// public
router.get("/", controller.listIncidents);
router.get("/:id", controller.getIncident);

// admin/mod
router.post("/", requireAuth, requireRole(["admin", "moderator"]), controller.createIncident);
router.patch("/:id", requireAuth, requireRole(["admin", "moderator"]), controller.updateIncident);
router.post("/:id/verify", requireAuth, requireRole(["admin", "moderator"]), controller.verifyIncident);
router.post("/:id/close", requireAuth, requireRole(["admin", "moderator"]), controller.closeIncident);

export default router;