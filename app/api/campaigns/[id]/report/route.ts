import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || (process.env.NODE_ENV === "development" ? "test-user-id" : null);

    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (process.env.DB_PROVIDER === "firebase") {
      const report = await firestore.getCampaignReport(userId, params.id);
      if (!report) return Response.json({ error: "Campaign not found" }, { status: 404 });
      return Response.json(report);
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id, userId },
      include: {
        smtpConfig: { select: { name: true, provider: true } },
        template: { select: { name: true } },
      }
    });

    if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });

    const recipients = await prisma.campaignRecipient.findMany({
        where: { campaignId: params.id },
        include: {
            contact: { select: { email: true, firstName: true, lastName: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });

    let sent = 0;
    let opened = 0;
    let clicked = 0;
    let bounced = 0;
    let pending = 0;

    const timelineData: Record<string, number> = {};

    recipients.forEach(r => {
        if (r.status === 'sent' || r.status === 'opened' || r.status === 'clicked') sent++;
        if (r.status === 'opened' || r.status === 'clicked') opened++;
        if (r.status === 'clicked') clicked++;
        if (r.status === 'bounced' || r.status === 'failed') bounced++;
        if (r.status === 'pending') pending++;

        // Process timeline data based on updatedAt (simplified by day/hour based on volume)
        if (r.status !== 'pending') {
            const dateStr = r.updatedAt.toISOString().split('T')[0];
            if (!timelineData[dateStr]) timelineData[dateStr] = 0;
            timelineData[dateStr]++;
        }
    });

    const chartData = Object.keys(timelineData).sort().map(date => ({
        date,
        activity: timelineData[date]
    }));

    return Response.json({
        campaign,
        stats: {
            total: recipients.length,
            sent,
            opened,
            clicked,
            bounced,
            pending
        },
        chartData,
        recipients: recipients.map(r => ({
            id: r.id,
            email: r.contact.email,
            name: r.contact.firstName ? `${r.contact.firstName} ${r.contact.lastName || ""}` : "",
            status: r.status,
            error: r.error,
            sentAt: r.sentAt,
            openedAt: r.openedAt,
            clickedAt: r.clickedAt,
        }))
    });
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
