import { NextRequest, NextResponse } from "next/server";
import { refreshDigest } from "@/lib/digest/digest-utils";

// Admin token for authorization (set in environment)
const ADMIN_TOKEN = process.env.DIGEST_ADMIN_TOKEN || process.env.CRON_SECRET;

// POST /api/digest/refresh - Trigger RSS collection and summarization
export async function POST(req: NextRequest) {
    // Check authorization
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Also check x-admin-token header
    const adminToken = req.headers.get("x-admin-token");

    // For cron jobs (Vercel Cron)
    const cronSecret = req.headers.get("x-cron-secret");

    const isAuthorized =
        (ADMIN_TOKEN && (token === ADMIN_TOKEN || adminToken === ADMIN_TOKEN || cronSecret === ADMIN_TOKEN));

    if (!isAuthorized) {
        // In development, allow without token
        if (process.env.NODE_ENV !== "development") {
            return NextResponse.json(
                { error: "Unauthorized. Provide admin token via Authorization header or x-admin-token." },
                { status: 401 }
            );
        }
    }

    try {
        console.log("[Digest Refresh] Starting...");
        const startTime = Date.now();

        const result = await refreshDigest();

        const duration = Date.now() - startTime;
        console.log(`[Digest Refresh] Completed in ${duration}ms:`, result);

        return NextResponse.json({
            success: true,
            ...result,
            duration_ms: duration,
        });
    } catch (error) {
        console.error("[Digest Refresh] Error:", error);
        return NextResponse.json(
            {
                error: "Digest refresh failed",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

// GET /api/digest/refresh - Check status (development only)
export async function GET() {
    return NextResponse.json({
        status: "ready",
        endpoint: "POST /api/digest/refresh",
        description: "Trigger RSS collection and AI summarization",
        authorization: "Requires DIGEST_ADMIN_TOKEN or CRON_SECRET in Authorization header",
    });
}
