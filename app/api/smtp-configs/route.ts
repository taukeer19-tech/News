import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "smtp:read");
  if (deny) return deny;

  if (IS_FIREBASE) {
    return Response.json(await firestore.getSmtpConfigs(auth.userId));
  }
  const configs = await prisma.smtpConfig.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" } });
  return Response.json(configs);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "smtp:write");
  if (deny) return deny;

  const json = await request.json();
  const { name, provider, apiKey, host, port, encryption, username, password, fromEmail, fromName, isActive } = json;
  if (!name || !provider || !fromEmail) return Response.json({ error: "Name, provider, and fromEmail are required" }, { status: 400 });

  const data = { name, provider, apiKey: apiKey || null, host: host || null, port: port ? parseInt(port) : null, encryption: encryption || null, username: username || null, password: password || null, fromEmail, fromName: fromName || null, isActive: isActive !== undefined ? isActive : true };

  if (IS_FIREBASE) {
    const config = await firestore.addSmtpConfig(auth.userId, data);
    await addAuditLog(auth, "smtp.created", "smtpConfig", config.id, { name });
    return Response.json(config, { status: 201 });
  }
  const config = await prisma.smtpConfig.create({ data: { userId: auth.userId, workspaceId: auth.workspaceId, ...data } });
  await addAuditLog(auth, "smtp.created", "smtpConfig", config.id, { name });
  return Response.json(config, { status: 201 });
}
