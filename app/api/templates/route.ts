import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "templates:read");
  if (deny) return deny;

  if (IS_FIREBASE) return Response.json(await firestore.getTemplates(auth.workspaceId));
  const templates = await prisma.template.findMany({ where: { workspaceId: auth.workspaceId }, orderBy: { createdAt: "desc" } });
  return Response.json(templates);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "templates:write");
  if (deny) return deny;

  const json = await request.json();
  const { name, subject, contentHtml, contentText } = json;
  if (!name || !subject || !contentHtml) return Response.json({ error: "Name, subject, and content are required" }, { status: 400 });

  if (IS_FIREBASE) {
    const tpl = await firestore.addTemplate(auth.userId, { name, subject, contentHtml, contentText, workspaceId: auth.workspaceId });
    await addAuditLog(auth, "template.created", "template", tpl.id, { name });
    return Response.json(tpl, { status: 201 });
  }
  const tpl = await prisma.template.create({ data: { userId: auth.userId, workspaceId: auth.workspaceId, name, subject, contentHtml, contentText: contentText || "" } });
  await addAuditLog(auth, "template.created", "template", tpl.id, { name });
  return Response.json(tpl, { status: 201 });
}
