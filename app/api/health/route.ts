import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { redisConnection } from "@/lib/queue/reviewQueue";

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  services: {
    database: "ok" | "error";
    redis: "ok" | "error";
  };
}

export async function GET() {
  try {
    // 1 & 2. Prepare checks
    const dbCheck = prisma.$queryRaw`SELECT 1`;
    const redisCheck = redisConnection.ping();

    // 3. Run in parallel (non-blocking)
    const [dbResult, redisResult] = await Promise.allSettled([
      dbCheck,
      redisCheck,
    ]);

    const databaseStatus =
      dbResult.status === "fulfilled" ? "ok" : "error";

    const redisStatus =
      redisResult.status === "fulfilled" ? "ok" : "error";

    // 4. Determine overall status
    let overallStatus: HealthStatus["status"] = "ok";
    let httpStatus = 200;

    if (databaseStatus === "error" && redisStatus === "error") {
      overallStatus = "down";
      httpStatus = 503;
    } else if (databaseStatus === "error" || redisStatus === "error") {
      overallStatus = "degraded";
      httpStatus = 200;
    }

    // 5. Response
    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        redis: redisStatus,
      },
    };

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    
    // Edge fallback (should rarely hit because of allSettled)
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "down",
        timestamp: new Date().toISOString(),
        services: {
          database: "error",
          redis: "error",
        },
      },
      { status: 503 }
    );
  }
}
