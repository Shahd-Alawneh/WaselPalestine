import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { errorHandler } from "./common/errors/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import alertsRoutes from "./modules/alerts/alerts.routes";
import routesRoutes from "./modules/routes/routes.routes";
import checkpointRoutes from "./modules/checkpoints/checkpoints.routes";
import incidentRoutes from "./modules/incidents/incidents.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import integrationsRoutes from "./integrations/integrations.routes";
import { setupSwagger } from "./config/swagger";

dotenv.config();

const app = express();
setupSwagger(app);
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Core modules
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/alerts", alertsRoutes);
app.use("/api/v1/routes", routesRoutes);
app.use("/api/v1/checkpoints", checkpointRoutes);
app.use("/api/v1/incidents", incidentRoutes);
app.use("/api/v1/reports", reportsRoutes);

// External integrations
app.use("/api/v1/integrations", integrationsRoutes);

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
