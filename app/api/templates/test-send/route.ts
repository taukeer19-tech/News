import { NextResponse as Response } from "next/server";
import { requireAuth } from "@/lib/rbac";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "tmp", "local_db.json");
const TEMPLATE_FILE = path.join(process.cwd(), "bombino-template.html");

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) return { templates: [], smtpConfigs: [] };
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { templates: [], smtpConfigs: [] };
  }
}

/** Wraps a body HTML snippet inside the full Bombino Express email template */
function wrapInTemplate(bodyHtml: string): string {
  try {
    const template = fs.readFileSync(TEMPLATE_FILE, "utf-8");
    return template.replace("{{email_body}}", bodyHtml);
  } catch {
    return bodyHtml;
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const { templateId, toEmail } = body;

    if (!templateId || !toEmail) {
      return Response.json({ error: "templateId and toEmail are required" }, { status: 400 });
    }

    const db = readDb();

    // Get the template
    const template = (db.templates || []).find((t: any) => t.id === templateId && t.userId === auth.userId);
    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    // Get SMTP config
    const smtpConfigs = (db.smtpConfigs || []).filter((s: any) => s.userId === auth.userId);
    const smtpConfig = smtpConfigs[0];

    if (!smtpConfig) {
      return Response.json({ error: "No SMTP configuration found. Please add an SMTP server first." }, { status: 400 });
    }

    const fromField = smtpConfig.fromName
      ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
      : smtpConfig.fromEmail;

    // Wrap content in the bombino-template.html
    // If the template itself already IS the full HTML (contains <html>), send it directly
    // Otherwise wrap the body content in the template
    let emailHtml: string;
    const isFullHtml = template.contentHtml.trim().toLowerCase().startsWith("<!doctype") ||
                       template.contentHtml.trim().toLowerCase().startsWith("<html");

    if (isFullHtml) {
      // Template already has full HTML — send directly, but replace {{email_body}} if present
      emailHtml = template.contentHtml.includes("{{email_body}}")
        ? template.contentHtml.replace("{{email_body}}", "<p>This is a test email.</p>")
        : template.contentHtml;
    } else {
      // Template body HTML — wrap in the Bombino template
      emailHtml = wrapInTemplate(template.contentHtml);
    }

    emailHtml += `<div style="text-align:center;padding:8px 0;font-size:11px;color:#999;">This is a test email sent from Bombino Express Email Platform.</div>`;

    let transporter: any;
    if (smtpConfig.provider === "resend") {
      transporter = nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: { user: "resend", pass: smtpConfig.apiKey },
      });
    } else if (smtpConfig.provider === "smtp") {
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.encryption === "ssl",
        auth: { user: smtpConfig.username, pass: smtpConfig.password },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: smtpConfig.host || "smtp.gmail.com",
        port: smtpConfig.port || 587,
        secure: false,
        auth: {
          user: smtpConfig.username || smtpConfig.fromEmail,
          pass: smtpConfig.password || smtpConfig.apiKey,
        },
      });
    }

    await transporter.sendMail({
      from: fromField,
      to: toEmail,
      subject: `[TEST] ${template.subject}`,
      html: emailHtml,
    });

    return Response.json({
      success: true,
      message: `Test email sent to ${toEmail} successfully!`,
    });
  } catch (error: any) {
    console.error("Test Send Error:", error);
    return Response.json({ error: error.message || "Failed to send test email" }, { status: 500 });
  }
}
