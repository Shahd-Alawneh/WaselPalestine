import { Router } from "express";
import * as controller from "./checkpoints.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { requireRole } from "../../common/middlewares/requireRole";

const router = Router();

// public
router.get("/", controller.listCheckpoints);
router.get("/:id", controller.getCheckpoint);
router.get("/:id/history", controller.getCheckpointHistory);

// admin/mod
router.post("/", requireAuth, requireRole(["admin", "moderator"]), controller.createCheckpoint);
router.post(
  "/:id/status",
  requireAuth,
  requireRole(["admin", "moderator"]),
  controller.setCheckpointStatus
);

export default router;