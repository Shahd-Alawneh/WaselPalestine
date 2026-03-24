import { Router } from "express";
import * as controller from "./auth.controller";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { requireRole } from "../../common/middlewares/requireRole";

const router = Router();
/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Shahd Alawneh
 *               email:
 *                 type: string
 *                 example: shahdalawneh0@gmail.com
 *               password:
 *                 type: string
 *                 example: Password1234
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post("/register", controller.register);
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: shahdalawneh0@gmail.com
 *               password:
 *                 type: string
 *                 example: Password1234
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
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