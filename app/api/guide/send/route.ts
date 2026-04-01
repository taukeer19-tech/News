import { NextResponse as Response } from "next/server";
import { requireAuth, addAuditLog } from "@/lib/rbac";
import { firestore } from "@/lib/firestore";
import { sendEmail } from "@/lib/mailer";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { email, manualHtml } = await request.json();
    if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

    if (IS_FIREBASE) {
      const smtpConfig = await firestore.getWorkspaceSmtp(auth.workspaceId);
      if (!smtpConfig) {
        return Response.json({ error: "No active SMTP configuration found in workspace" }, { status: 400 });
      }

      await sendEmail({
        to: email,
        subject: "Your Bombino Express User Manual 📖",
        smtpConfigId: smtpConfig.id,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 800px; margin: auto; padding: 20px;">
            <h1 style="color: #8b5cf6;">Bombino Express User Manual</h1>
            <p>Hello,</p>
            <p>You requested a copy of the direct user manual for the Bombino Express Email Marketing Platform. This manual covers everything from SMTP setup to campaign tracking.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            ${manualHtml || "Please visit the platform at http://localhost:3000/guide to view the full manual."}
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Sent from your Bombino Express Workspace.</p>
          </div>
        `
      });

      await addAuditLog(auth, "guide.sent", "guide", auth.workspaceId, { recipient: email });
      return Response.json({ success: true });
    }

    return Response.json({ error: "Not supported" }, { status: 500 });
  } catch (error: any) {
    console.error("Failed to email manual:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
