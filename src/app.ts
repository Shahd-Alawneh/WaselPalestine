import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { errorHandler } from "./common/errors/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import checkpointRoutes from "./modules/checkpoints/checkpoints.routes";
import incidentRoutes from "./modules/incidents/incidents.routes";


dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/checkpoints", checkpointRoutes);
app.use("/api/v1/incidents", incidentRoutes);
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use(errorHandler);

export default app;
