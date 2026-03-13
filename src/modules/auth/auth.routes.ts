import { Router } from "express";
import * as controller from "./auth.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { requireRole } from "../../common/middlewares/requireRole";

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", requireAuth, (req: any, res) => {res.json({success: true,data: req.user});});
// Admin only test
router.get("/admin-test", requireAuth, requireRole(["admin"]), (req, res) => 
    {res.json({
    success: true,
    message: "Welcome Admin ✅",
  });
});
export default router;