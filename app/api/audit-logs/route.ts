import { NextResponse as Response } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { firestore } from "@/lib/firestore";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "audit:read");
  if (deny) return deny;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  if (IS_FIREBASE) {
    const logs = await firestore.getAuditLogs(auth.workspaceId, limit);
    return Response.json(logs);
  }

  return Response.json([]);
}
