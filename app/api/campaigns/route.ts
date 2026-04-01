import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "campaigns:read");
  if (deny) return deny;

  if (IS_FIREBASE) {
    return Response.json(await firestore.getCampaigns(auth.userId));
  }
  const campaigns = await prisma.campaign.findMany({
    where: { userId: auth.userId },
    include: { smtpConfig: { select: { name: true } }, _count: { select: { recipients: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(campaigns);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "campaigns:write");
  if (deny) return deny;

  const json = await request.json();
  const { subject, contentHtml, contentText, smtpConfigId, templateId, scheduledAt, listIds, attachments, sendingRate } = json;
  if (!subject || !contentHtml) return Response.json({ error: "Subject and content are required" }, { status: 400 });

  if (IS_FIREBASE) {
    const campaign = await firestore.addCampaign(auth.userId, { subject, contentHtml, contentText, smtpConfigId, templateId, scheduledAt, status: "draft" });
    await addAuditLog(auth, "campaign.created", "campaign", campaign.id, { subject });
    return Response.json(campaign, { status: 201 });
  }

  const campaign = await prisma.campaign.create({
    data: { userId: auth.userId, workspaceId: auth.workspaceId, subject, contentHtml, contentText: contentText || null, smtpConfigId, templateId, scheduledAt: scheduledAt ? new Date(scheduledAt) : null, status: "draft", attachments: attachments ? JSON.stringify(attachments) : "[]", sendingRate: sendingRate || 0 },
  });

  // Add recipients
  let targetContacts: any[] = [];
  if (listIds && listIds.length > 0 && !listIds.includes("all")) {
    const listContacts = await prisma.contactListContact.findMany({
      where: { listId: { in: listIds }, contact: { unsubscribed: false, userId: auth.userId } },
      select: { contactId: true },
    });
    const uniqueIds = Array.from(new Set(listContacts.map((lc) => lc.contactId)));
    targetContacts = uniqueIds.map((id) => ({ id }));
  } else {
    targetContacts = await prisma.contact.findMany({ where: { userId: auth.userId, unsubscribed: false }, select: { id: true } });
  }

  if (targetContacts.length > 0) {
    // Check existing recipients to avoid duplicates (skipDuplicates not supported on all DBs)
    const existing = await prisma.campaignRecipient.findMany({
      where: { campaignId: campaign.id },
      select: { contactId: true },
    });
    const existingIds = new Set(existing.map((r) => r.contactId));
    const newContacts = targetContacts.filter((c) => !existingIds.has(c.id));
    if (newContacts.length > 0) {
      await prisma.campaignRecipient.createMany({
        data: newContacts.map((c) => ({ campaignId: campaign.id, contactId: c.id, status: "pending" })),
      });
    }
  }

  await addAuditLog(auth, "campaign.created", "campaign", campaign.id, { subject });
  return Response.json(campaign, { status: 201 });
}
