import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";
const IS_DEV = process.env.NODE_ENV === "development";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || (IS_DEV ? "test-user-id" : null);

    if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (IS_FIREBASE) {
        const metrics = await firestore.getDashboardMetrics(userId);
        console.log(`Dashboard Debug - User: ${userId}, Metrics:`, JSON.stringify(metrics));
        return Response.json(metrics);
    }

    const [totalContacts, totalCampaigns, recentCampaigns, unsubs] = await Promise.all([
      prisma.contact.count({ where: { userId } }),
      prisma.campaign.count({ where: { userId } }),
      prisma.campaign.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
            _count: { select: { recipients: true } },
            recipients: { select: { status: true } }
        }
      }),
      prisma.contact.count({ where: { userId, unsubscribed: true } })
    ]);

    const campaignsWithMetrics = recentCampaigns.map(camp => {
        let sent = 0;
        let opened = 0;
        let clicked = 0;
        
        camp.recipients.forEach(r => {
            if (r.status === 'sent' || r.status === 'opened' || r.status === 'clicked') sent++;
            if (r.status === 'opened' || r.status === 'clicked') opened++;
            if (r.status === 'clicked') clicked++;
        });

        return {
            id: camp.id,
            subject: camp.subject,
            status: camp.status,
            totalRecipients: camp._count.recipients,
            sent,
            opened,
            clicked
        };
    });

    return Response.json({
        totalContacts,
        totalCampaigns,
        unsubscribes: unsubs,
        recentCampaigns: campaignsWithMetrics
    });
  } catch (error) {
    console.error("GET Dashboard Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

