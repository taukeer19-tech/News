import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    // 1. Verify QStash request (omitted for brevity, assume valid internal call or verified via upstash sdk)
    
    const body = await request.json();
    const { campaignId, recipientId } = body;

    if (!campaignId || !recipientId) {
      return Response.json({ error: "Missing campaignId or recipientId" }, { status: 400 });
    }

    // 2. Load Campaign, Recipient(Contact), and SMTP Config
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { smtpConfig: true }
    });

    const recipient = await prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
      include: { contact: true }
    });

    if (!campaign || !campaign.smtpConfig || !recipient) {
      return Response.json({ error: "Invalid payload data" }, { status: 404 });
    }

    if (recipient.status !== "pending" && recipient.status !== "failed") {
        return Response.json({ message: "Already processed" }, { status: 200 });
    }

    if (recipient.contact.unsubscribed) {
        await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "failed", error: "Contact is unsubscribed" }
        });
        return Response.json({ message: "Skipped unsubscribed contact" });
    }

    const { smtpConfig, subject, contentHtml, contentText } = campaign;
    const { contact } = recipient;

    // 3. Prepare Trackable Content
    const baseUrl = process.env.NEXTAUTH_URL || "https://example.com";
    const trackingPixel = `<img src="${baseUrl}/api/track/open?campaignId=${campaign.id}&contactId=${contact.id}" width="1" height="1" style="display:none;" />`;
    const unsubscribeLink = `${baseUrl}/unsubscribe/${contact.id}/${campaign.id}`;
    
    // Convert links to click tracking (simplified example)
    let processedHtml = contentHtml.replace(/href="([^"]+)"/g, (match, url) => {
        if (url.startsWith('mailto:') || url.startsWith('tel:')) return match;
        const encoded = encodeURIComponent(url);
        return `href="${baseUrl}/api/track/click?url=${encoded}&campaignId=${campaign.id}&contactId=${contact.id}"`;
    });

    processedHtml += trackingPixel;
    processedHtml += `<br><br><p style="font-size: 12px; color: #666;">If you no longer wish to receive these emails, you can <a href="${unsubscribeLink}">unsubscribe here</a>.</p>`;

    // 4. Send Email based on Provider
    let messageId = "";
    
    try {
        if (smtpConfig.provider === "resend") {
            const resendUrl = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY : smtpConfig.apiKey!;
            const resend = new Resend(resendUrl);
            
            const fromField = smtpConfig.fromName ? `${smtpConfig.fromName} <${smtpConfig.fromEmail}>` : smtpConfig.fromEmail;
            
            const { data, error } = await resend.emails.send({
                from: fromField,
                to: contact.email,
                subject: subject,
                html: processedHtml,
                text: contentText || "",
            });

            if (error) throw new Error(error.message);
            messageId = data?.id || "";

        } else if (smtpConfig.provider === "smtp") {
            const transporter = nodemailer.createTransport({
                host: smtpConfig.host!,
                port: smtpConfig.port!,
                secure: smtpConfig.encryption === 'ssl',
                auth: {
                    user: smtpConfig.username!,
                    pass: smtpConfig.password!
                }
            });

            const fromField = smtpConfig.fromName ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>` : smtpConfig.fromEmail;
            
            const info = await transporter.sendMail({
                from: fromField,
                to: contact.email,
                subject: subject,
                html: processedHtml,
                text: contentText || "",
            });
            
            messageId = info.messageId;
        } else {
            // Mock other providers for now
            console.log(`Sending via ${smtpConfig.provider} to ${contact.email}`);
            messageId = `mock-${Date.now()}`;
        }

        // 5. Update Recipient Status
        await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "sent", sentAt: new Date() }
        });

        // 6. Check if campaign is fully sent
        const pendingCount = await prisma.campaignRecipient.count({
            where: { campaignId: campaign.id, status: "pending" }
        });
        
        if (pendingCount === 0) {
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: { status: "sent", sentAt: new Date() }
            });
            
            // Optionally create a notification here
            await prisma.notification.create({
                data: {
                    userId: campaign.userId,
                    type: "campaign_completed",
                    message: `Campaign "${campaign.subject}" has finished sending.`
                }
            });
        }

        return Response.json({ success: true, messageId });
    } catch (sendError: any) {
        await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "failed", error: sendError.message }
        });
        return Response.json({ error: sendError.message }, { status: 500 });
    }

  } catch (error) {
    console.error("Send Email Webhook Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
