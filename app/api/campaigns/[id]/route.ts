import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "campaigns:read");
  if (deny) return deny;

  if (IS_FIREBASE) {
    const campaign = await firestore.getCampaignById(auth.userId, params.id);
    if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });
    return Response.json(campaign);
  }
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id, userId: auth.userId },
    include: { smtpConfig: true, _count: { select: { recipients: true } } },
  });
  if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });
  return Response.json(campaign);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "campaigns:write");
  if (deny) return deny;

  const json = await request.json();
  const { subject, contentHtml, contentText, smtpConfigId, templateId, scheduledAt, status } = json;

  const existing = await prisma.campaign.findUnique({ where: { id: params.id, userId: auth.userId } }) as any;
  if (!existing) return Response.json({ error: "Campaign not found" }, { status: 404 });
  if (existing.status !== "draft") return Response.json({ error: "Can only update draft campaigns" }, { status: 400 });

  const updated = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      subject: subject ?? existing.subject,
      contentHtml: contentHtml ?? existing.contentHtml,
      contentText: contentText !== undefined ? contentText : existing.contentText,
      smtpConfigId: smtpConfigId !== undefined ? smtpConfigId : existing.smtpConfigId,
      templateId: templateId !== undefined ? templateId : existing.templateId,
      scheduledAt: scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : existing.scheduledAt,
      status: status ?? existing.status,
    },
  });
  await addAuditLog(auth, "campaign.updated", "campaign", params.id, { subject });
  return Response.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "campaigns:delete");
  if (deny) return deny;

  if (IS_FIREBASE) {
    const campaign = await firestore.getCampaignById(auth.userId, params.id);
    if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });
    await firestore.deleteCampaign(params.id);
  } else {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id, userId: auth.userId } });
    if (!existing) return Response.json({ error: "Campaign not found" }, { status: 404 });
    await prisma.campaign.delete({ where: { id: params.id } });
  }

  await addAuditLog(auth, "campaign.deleted", "campaign", params.id);
  return Response.json({ success: true });
}
