import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, addAuditLog } from "@/lib/rbac";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const TEMPLATE_FILE = path.join(process.cwd(), "bombino-template.html");

/** Wraps a body HTML snippet inside the full Bombino Express email template */
function wrapInTemplate(bodyHtml: string): string {
  try {
    const template = fs.readFileSync(TEMPLATE_FILE, "utf-8");
    return template.replace("{{email_body}}", bodyHtml);
  } catch {
    return bodyHtml;
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;

    // Fetch campaign with related data using Prisma
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id, userId: auth.userId },
      include: {
        smtpConfig: true,
        template: true,
      }
    });

    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return Response.json({ error: "Campaign has already been sent or is sending" }, { status: 400 });
    }

    // Get all subscribed contacts for this user/workspace
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId: campaign.id, contact: { unsubscribed: false } },
      include: { contact: true }
    });

    if (recipients.length === 0) {
      return Response.json({ error: "No subscribed contacts found to send to." }, { status: 400 });
    }

    const smtpConfig = campaign.smtpConfig;
    if (!smtpConfig) {
      return Response.json({ error: "No SMTP configuration found for this campaign." }, { status: 400 });
    }

    // Get the campaign body content
    let bodyHtml = campaign.contentHtml || campaign.template?.contentHtml || "";
    if (!bodyHtml) {
      return Response.json({ error: "No email content found for this campaign." }, { status: 400 });
    }

    // Wrap the body inside the full Bombino Express HTML template
    const fullHtml = wrapInTemplate(bodyHtml);

    // Update campaign status to sending
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "sending" }
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const fromField = smtpConfig.fromName
      ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
      : smtpConfig.fromEmail;

    // Prepare attachments for Nodemailer
    let attachments: any[] = [];
    try {
        attachments = JSON.parse(campaign.attachments || "[]").map((att: any) => ({
            filename: att.name,
            path: att.path,
            contentType: att.type
        }));
    } catch (e) {
        console.error("Failed to parse attachments:", e);
    }

    let sentCount = 0;
    let failedCount = 0;

    // Transporter creation
    let transporter: any;
    if (smtpConfig.provider === "resend") {
      transporter = nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: { user: "resend", pass: smtpConfig.apiKey || "" },
      });
    } else if (smtpConfig.provider === "gmail") {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: smtpConfig.username || smtpConfig.fromEmail,
          pass: smtpConfig.password || smtpConfig.apiKey || ""
        }
      });
    } else if (smtpConfig.provider === "outlook") {
      transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false, // TLS
        requireTLS: true,
        auth: {
          user: smtpConfig.username || smtpConfig.fromEmail,
          pass: smtpConfig.password || smtpConfig.apiKey || ""
        }
      });
    } else if (smtpConfig.provider === "yahoo") {
      transporter = nodemailer.createTransport({
        host: "smtp.mail.yahoo.com",
        port: 465,
        secure: true,
        auth: {
          user: smtpConfig.username || smtpConfig.fromEmail,
          pass: smtpConfig.password || smtpConfig.apiKey || ""
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: smtpConfig.host || "smtp.gmail.com",
        port: smtpConfig.port || 587,
        secure: smtpConfig.encryption === "ssl",
        auth: {
          user: smtpConfig.username || smtpConfig.fromEmail,
          pass: smtpConfig.password || smtpConfig.apiKey || "",
        },
      });
    }

    // Send emails
    for (const recipient of recipients) {
      const contact = recipient.contact;
      try {
        const unsubscribeLink = `${baseUrl}/unsubscribe/${contact.id}/${campaign.id}`;
        const emailHtml = fullHtml +
          `<div style="text-align:center;padding:8px;font-size:11px;color:#999;">If you no longer wish to receive these emails, <a href="${unsubscribeLink}" style="color:#1376C8;">unsubscribe here</a>.</div>`;

        await transporter.sendMail({
          from: fromField,
          to: contact.email,
          subject: campaign.subject,
          html: emailHtml,
          attachments: attachments // Add attachments here
        });

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "sent", sentAt: new Date() }
        });
        sentCount++;
      } catch (err: any) {
        console.error(`Failed to send to ${contact.email}:`, err.message);
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "failed", error: err.message }
        });
        failedCount++;
      }
    }

    // Update campaign final status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { 
        status: "sent", 
        sentAt: new Date(),
      }
    });

    await addAuditLog(auth, "campaign.sent", "campaign", params.id, {
      subject: campaign.subject,
      sent: sentCount,
      failed: failedCount,
      total: recipients.length,
    });

    return Response.json({
      success: true,
      message: `Campaign sent! ${sentCount} emails delivered, ${failedCount} failed.`,
      sent: sentCount,
      failed: failedCount,
      total: recipients.length,
    });
  } catch (error: any) {
    console.error("Send Campaign Error:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
