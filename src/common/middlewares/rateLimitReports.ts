import type { NextFunction, Request, Response } from "express";
import redisClient from "../../db/redis";

type AuthenticatedRequest = Request & {
  user?: {
    id?: string | number;
    sub?: string | number;
  };
};

const WINDOW_SECONDS = 60;
const USER_LIMIT = 3;
const IP_LIMIT = 10;

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }

  return req.ip ?? "unknown";
}

async function incrementWindowCounter(key: string): Promise<number> {
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, WINDOW_SECONDS);
  }
  return count;
}

function sendRateLimitResponse(res: Response): void {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Too many reports, try again later",
    },
  });
}

export async function rateLimitCreateReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id ?? authReq.user?.sub;

    if (userId === undefined || userId === null) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const ip = getClientIp(req);

    const userKey = `rate:reports:user:${String(userId)}`;
    const ipKey = `rate:reports:ip:${ip}`;

    const userCount = await incrementWindowCounter(userKey);
    if (userCount > USER_LIMIT) {
      sendRateLimitResponse(res);
      return;
    }

    const ipCount = await incrementWindowCounter(ipKey);
    if (ipCount > IP_LIMIT) {
      sendRateLimitResponse(res);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default rateLimitCreateReport;
