import { Response, NextFunction } from "express";
import { AuthRequest } from "./requireAuth";

export function requireRole(allowed: Array<"admin" | "moderator" | "citizen">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowed.includes(role as any)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
}
