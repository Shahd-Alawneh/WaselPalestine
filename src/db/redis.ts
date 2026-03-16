import { createClient } from "redis";

const host = process.env.REDIS_HOST || "127.0.0.1";
const port = Number(process.env.REDIS_PORT || 6379);

const client = createClient({
  socket: {
    host,
    port,
  },
});

client.on("connect", () => {
  console.log("Redis connected");
});

client.on("error", (error: unknown) => {
  console.error("Redis error:", error);
});

void client.connect().catch((error: unknown) => {
  console.error("Redis error:", error);
});

export default client;
