import app from "./src/app.js";
import prisma from "./src/config/database.js";
import redis from "./src/config/redis.js";

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {

    /**
     * 1️⃣ Connect Database
     */
    await prisma.$connect();
    console.log("Database connected");

    /**
     * 2️⃣ Connect Redis
     */
    await redis.ping();
    console.log("Redis connected");

    /**
     * 3️⃣ Start HTTP Server
     */
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
};

/**
 * 4️⃣ Graceful Shutdown
 */
const shutdown = async () => {
  console.log("Shutting down server...");

  try {
    if (server) {
      server.close(() => {
        console.log("HTTP server closed");
      });
    }

    await prisma.$disconnect();
    console.log("Database disconnected");

    await redis.quit();
    console.log("Redis disconnected");

    process.exit(0);

  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
};

// Handle termination signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();