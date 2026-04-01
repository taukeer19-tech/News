import { NextResponse as Response } from "next/server";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";
import { firestore } from "@/lib/firestore";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";
const USER_GUIDE_URL = "/guide"; // Updated to internal route

// GET /api/workspace/members — list all workspace members
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "team:read");
  if (deny) return deny;

  if (IS_FIREBASE) {
    const members = await firestore.getWorkspaceMembers(auth.workspaceId);
    return Response.json(members);
  }
  return Response.json([]);
}

// POST /api/workspace/members — add a new member and send welcome email
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "team:invite");
  if (deny) return deny;

  const { email, role, password } = await request.json();
  if (!email || !password) {
    return Response.json({ error: "Email and Password are required" }, { status: 400 });
  }

  const validRoles = ["admin", "member", "viewer"];
  const assignedRole = validRoles.includes(role) ? role : "member";

  if (IS_FIREBASE) {
    try {
      // Direct Creation Flow
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await firestore.createUser({
        email,
        passwordHash,
        role: assignedRole,
        workspaceId: auth.workspaceId,
        name: email.split("@")[0],
      });
      
      await addAuditLog(auth, "member.created", "user", user.id, { email, role: assignedRole });

      // Send Welcome Email
      const smtpConfig = await firestore.getWorkspaceSmtp(auth.workspaceId);
      if (smtpConfig) {
        try {
          await sendEmail({
            to: email,
            subject: "Welcome to Bombino Express! 📧",
            smtpConfigId: smtpConfig.id,
            html: `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #8b5cf6;">Welcome to Bombino Express!</h2>
                <p>Hello,</p>
                <p>Your account has been created for the workspace. You can now log in using the details below:</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                  <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                </div>
                <p>To get started, please review our <strong>User Guide</strong> here:</p>
                <p><a href="${USER_GUIDE_URL}" style="display: inline-block; background: #8b5cf6; color: #white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">View User Guide</a></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">If you have any questions, please contact your workspace administrator.</p>
              </div>
            `
          });
          await addAuditLog(auth, "member.updated", "user", user.id, { action: "welcome_email_sent" });
        } catch (emailErr) {
          console.error("Failed to send welcome email:", emailErr);
          // Don't stop the user creation if email fails, but maybe report it?
          return Response.json({ 
            success: true, 
            user, 
            warning: "User created, but failed to send welcome email." 
          }, { status: 201 });
        }
      }

      return Response.json({ success: true, user }, { status: 201 });
    } catch (err: any) {
      return Response.json({ error: err.message || "Failed to add user" }, { status: 400 });
    }
  }

  return Response.json({ error: "Database provider not supported" }, { status: 500 });
}
