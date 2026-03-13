import type { Response } from "express";
import type { AuthRequest } from "../../common/middlewares/requireAuth";
import { estimateRouteSchema } from "./routes.validation";
import * as service from "./routes.service";

export async function estimateRoute(req: AuthRequest, res: Response) {
    const parsed = estimateRouteSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: parsed.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
            })),
        });
    }

    const data = await service.estimateRoute(parsed.data);
    res.json({ success: true, data });
}

export async function getNetwork(_req: AuthRequest, res: Response) {
    const nodes = service.getNetwork();
    res.json({ success: true, data: { nodes, total: nodes.length } });
}
