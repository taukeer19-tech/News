import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// ─── Role Hierarchy ───────────────────────────────────────────────────────────
export type UserRole = "owner" | "admin" | "member" | "viewer";

const ROLE_RANK: Record<UserRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

// ─── Permission Definitions ───────────────────────────────────────────────────
export const PERMISSIONS = {
  // Contacts
  "contacts:read":   ["viewer", "member", "admin", "owner"],
  "contacts:write":  ["member", "admin", "owner"],
  "contacts:delete": ["admin", "owner"],

  // Campaigns
  "campaigns:read":   ["viewer", "member", "admin", "owner"],
  "campaigns:write":  ["member", "admin", "owner"],
  "campaigns:delete": ["admin", "owner"],
  "campaigns:send":   ["admin", "owner"],

  // Lists
  "lists:read":   ["viewer", "member", "admin", "owner"],
  "lists:write":  ["member", "admin", "owner"],
  "lists:delete": ["admin", "owner"],

  // Templates
  "templates:read":   ["viewer", "member", "admin", "owner"],
  "templates:write":  ["member", "admin", "owner"],
  "templates:delete": ["admin", "owner"],

  // SMTP Configs
  "smtp:read":   ["admin", "owner"],
  "smtp:write":  ["admin", "owner"],
  "smtp:delete": ["admin", "owner"],

  // Team / Workspace
  "team:read":       ["admin", "owner"],
  "team:invite":     ["admin", "owner"],
  "team:manage":     ["owner"],
  "workspace:manage": ["owner"],

  // Audit Logs
  "audit:read": ["admin", "owner"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ─── Session Shape ─────────────────────────────────────────────────────────
export type AuthSession = {
  userId: string;
  role: UserRole;
  workspaceId: string;
  email: string;
};

const IS_DEV = process.env.NODE_ENV === "development";
const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

// ─── Core Auth Helper ─────────────────────────────────────────────────────────
/**
 * Validates session and returns typed auth context.
 * In dev/firebase mode, returns a default test session if no real session exists.
 */
export async function requireAuth(): Promise<AuthSession | NextResponse> {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) {
    // Dev bypass for local Firebase testing
    if (IS_DEV && IS_FIREBASE) {
      return {
        userId: "test-user-id",
        role: "owner",
        workspaceId: "test-workspace-id",
        email: "dev@local.test",
      };
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return {
    userId: user.id,
    role: (user.role as UserRole) || "member",
    workspaceId: user.workspaceId || user.id, // Fallback: use userId as workspace for existing users
    email: user.email || "",
  };
}

// ─── Permission Guard ─────────────────────────────────────────────────────────
/** Returns true if the given role has a specific permission. */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly string[];
  return allowed.includes(role);
}

/** Throws a 403 NextResponse if role is not allowed. */
export function requirePermission(
  auth: AuthSession,
  permission: Permission
): NextResponse | null {
  if (!hasPermission(auth.role, permission)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `Your role '${auth.role}' does not have permission to perform '${permission}'.`,
      },
      { status: 403 }
    );
  }
  return null;
}

/** Checks if role is at least a given minimum role. */
export function hasMinRole(role: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

// ─── Audit Log Helper ─────────────────────────────────────────────────────────
import { firestore } from "@/lib/firestore";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  | "campaign.created"
  | "campaign.updated"
  | "campaign.deleted"
  | "campaign.sent"
  | "list.created"
  | "list.updated"
  | "list.deleted"
  | "smtp.created"
  | "smtp.updated"
  | "smtp.deleted"
  | "template.created"
  | "template.updated"
  | "template.deleted"
  | "member.invited"
  | "member.created"
  | "member.updated"
  | "member.role_changed"
  | "member.removed"
  | "guide.sent";

export async function addAuditLog(
  auth: AuthSession,
  action: AuditAction,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
) {
  try {
    if (IS_FIREBASE) {
      await firestore.addAuditLog({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        action,
        entityType,
        entityId,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
      });
    } else {
      await (prisma as any).auditLog.create({
        data: {
          userId: auth.userId,
          workspaceId: auth.workspaceId,
          action,
          entityType,
          entityId,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    }
  } catch (err) {
    // Never throw from audit logging — it's non-critical
    console.error("Audit log error:", err);
  }
}
