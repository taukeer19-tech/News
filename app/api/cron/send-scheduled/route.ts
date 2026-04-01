import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";
const TEMPLATE_FILE = path.join(process.cwd(), "bombino-template.html");

function wrapInTemplate(bodyHtml: string): string {
  try {
    const template = fs.readFileSync(TEMPLATE_FILE, "utf-8");
    return template.replace("{{email_body}}", bodyHtml);
  } catch {
    return bodyHtml;
  }
}

// Ensure the route is handled dynamically and bypasses edge caching
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    let campaignsToProcess: any[] = [];

    if (IS_FIREBASE) {
      campaignsToProcess = await firestore.getCampaignsForProcessing();
    } else {
      campaignsToProcess = await prisma.campaign.findMany({
        where: {
          status: { in: ["scheduled", "sending"] },
          scheduledAt: { lte: new Date() }
        },
        include: {
          smtpConfig: true,
          template: true,
        }
      });
    }

    if (campaignsToProcess.length === 0) {
      return Response.json({ message: "No scheduled campaigns pending." });
    }

    const results = [];

    // 2. Process each campaign
    for (const campaign of campaignsToProcess) {
      try {
        // Mark as "sending" to prevent concurrent cron runs from duplicating
        if (IS_FIREBASE) {
          await firestore.updateCampaign(campaign.id, { status: "sending" });
        } else {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: "sending" }
          });
        }

        // Fetch a chunk of recipients based on sendingRate
        let recipients: any[] = [];
        const limit = campaign.sendingRate > 0 ? campaign.sendingRate : undefined;

        if (IS_FIREBASE) {
          recipients = await firestore.getPendingRecipients(campaign.id, limit);
        } else {
          recipients = await prisma.campaignRecipient.findMany({
            where: { campaignId: campaign.id, status: "pending", contact: { unsubscribed: false } },
            include: { contact: true },
            take: limit
          });
        }

        const smtpConfig = campaign.smtpConfig;
        if (!smtpConfig || recipients.length === 0) {
          const status = "failed";
          if (IS_FIREBASE) {
            await firestore.updateCampaign(campaign.id, { status });
          } else {
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: { status }
            });
          }
          results.push({ id: campaign.id, error: "Missing config or recipients" });
          continue;
        }

        const bodyHtml = campaign.contentHtml || campaign.template?.contentHtml || "";
        const fullHtml = wrapInTemplate(bodyHtml);
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const fromField = smtpConfig.fromName ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>` : smtpConfig.fromEmail;
        
        // Attachments parsing
        let attachments: any[] = [];
        try { attachments = JSON.parse(campaign.attachments || "[]").map((a: any) => ({ filename: a.name, path: a.path, contentType: a.type })); } catch {}

        // Transporter creation
        let transporter: any;
        if (smtpConfig.provider === "resend") {
          transporter = nodemailer.createTransport({ host: "smtp.resend.com", port: 465, secure: true, auth: { user: "resend", pass: smtpConfig.apiKey || "" }});
        } else {
          transporter = nodemailer.createTransport({
            host: smtpConfig.host || "smtp.gmail.com",
            port: smtpConfig.port || 587,
            secure: smtpConfig.encryption === "ssl",
            auth: { user: smtpConfig.username || smtpConfig.fromEmail, pass: smtpConfig.password || smtpConfig.apiKey || "" }
          });
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const recipient of recipients) {
          const contact = recipient.contact;
          if (!contact || contact.unsubscribed) continue;

          try {
            const unsubscribeLink = `${baseUrl}/unsubscribe/${contact.id}/${campaign.id}`;
            const emailHtml = fullHtml + `<div style="text-align:center;padding:8px;font-size:11px;color:#999;">If you no longer wish to receive these emails, <a href="${unsubscribeLink}" style="color:#1376C8;">unsubscribe here</a>.</div>`;

            await transporter.sendMail({
              from: fromField, to: contact.email, subject: campaign.subject, html: emailHtml, attachments
            });

            const updateData = { status: "sent", sentAt: new Date().toISOString() };
            if (IS_FIREBASE) {
              await firestore.updateCampaignRecipient(recipient.id, updateData);
            } else {
              await prisma.campaignRecipient.update({
                where: { id: recipient.id },
                data: { status: "sent", sentAt: new Date() }
              });
            }
            sentCount++;
          } catch (err: any) {
            const updateData = { status: "failed", error: err.message };
            if (IS_FIREBASE) {
              await firestore.updateCampaignRecipient(recipient.id, updateData);
            } else {
              await prisma.campaignRecipient.update({
                where: { id: recipient.id },
                data: { status: "failed", error: err.message }
              });
            }
            failedCount++;
          }
        }

        // Check if there are any pending recipients left
        let remainingPending = 0;
        if (IS_FIREBASE) {
          remainingPending = await firestore.countPendingRecipients(campaign.id);
        } else {
          remainingPending = await prisma.campaignRecipient.count({
            where: { campaignId: campaign.id, status: "pending", contact: { unsubscribed: false } }
          });
        }

        // Finalize campaign OR keep it in 'sending' state
        const finalStatus = remainingPending > 0 ? "sending" : "sent";
        const sentAtValue = remainingPending > 0 ? null : new Date();

        if (IS_FIREBASE) {
          await firestore.updateCampaign(campaign.id, { 
            status: finalStatus, 
            sentAt: sentAtValue ? sentAtValue.toISOString() : null 
          });
        } else {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { 
              status: finalStatus, 
              sentAt: sentAtValue
            }
          });
        }

        // Create an audit log
        const logData = {
          userId: campaign.userId,
          workspaceId: campaign.workspaceId || campaign.userId,
          action: "campaign.sent",
          entityType: "campaign",
          entityId: campaign.id,
          metadata: { type: "cron", sent: sentCount, failed: failedCount, total: recipients.length },
        };

        if (IS_FIREBASE) {
          await firestore.addAuditLog(logData);
        } else {
          await (prisma as any).auditLog.create({
            data: {
              ...logData,
              metadata: JSON.stringify(logData.metadata)
            }
          });
        }

        results.push({ id: campaign.id, sent: sentCount, failed: failedCount });
      } catch (err: any) {
        // Fallback for unexpected failures
        if (IS_FIREBASE) {
          await firestore.updateCampaign(campaign.id, { status: "failed" });
        } else {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: "failed" }
          });
        }
        results.push({ id: campaign.id, error: err.message });
      }
    }

    return Response.json({ success: true, processed: results });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
