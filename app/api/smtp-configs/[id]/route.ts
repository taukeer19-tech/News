import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";
const IS_DEV = process.env.NODE_ENV === "development";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;
    const deny = requirePermission(auth, "smtp:read");
    if (deny) return deny;

    if (IS_FIREBASE) {
      const configs = await firestore.getSmtpConfigs(auth.userId);
      const config = configs.find((c: any) => c.id === params.id);
      if (!config) return Response.json({ error: "Configuration not found" }, { status: 404 });
      return Response.json(config);
    }

    const config = await prisma.smtpConfig.findUnique({
      where: { id: params.id, userId: auth.userId }
    });

    if (!config) return Response.json({ error: "Configuration not found" }, { status: 404 });
    return Response.json(config);
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;
    const deny = requirePermission(auth, "smtp:write");
    if (deny) return deny;

    const json = await request.json();

    if (IS_FIREBASE) {
      const configs = await firestore.getSmtpConfigs(auth.userId);
      const existing = configs.find((c: any) => c.id === params.id);
      if (!existing) return Response.json({ error: "Configuration not found" }, { status: 404 });

      const updated = {
        ...existing,
        name: json.name ?? existing.name,
        provider: json.provider ?? existing.provider,
        apiKey: json.apiKey !== undefined ? json.apiKey : existing.apiKey,
        host: json.host !== undefined ? json.host : existing.host,
        port: json.port !== undefined ? parseInt(json.port) : existing.port,
        encryption: json.encryption !== undefined ? json.encryption : existing.encryption,
        username: json.username !== undefined ? json.username : existing.username,
        password: json.password !== undefined ? json.password : existing.password,
        fromEmail: json.fromEmail ?? existing.fromEmail,
        fromName: json.fromName !== undefined ? json.fromName : existing.fromName,
        isActive: json.isActive ?? existing.isActive,
      };

      await firestore.updateSmtpConfig(params.id, updated);
      await addAuditLog(auth, "smtp.updated", "smtpConfig", params.id, { name: updated.name });
      return Response.json(updated);
    }
    
    // Check if configuration belongs to user
    const existing = await prisma.smtpConfig.findUnique({
      where: { id: params.id, userId: auth.userId }
    });
    if (!existing) return Response.json({ error: "Configuration not found" }, { status: 404 });

    const updated = await prisma.smtpConfig.update({
      where: { id: params.id },
      data: {
        name: json.name ?? existing.name,
        provider: json.provider ?? existing.provider,
        apiKey: json.apiKey !== undefined ? json.apiKey : existing.apiKey,
        host: json.host !== undefined ? json.host : existing.host,
        port: json.port !== undefined ? parseInt(json.port) : existing.port,
        encryption: json.encryption !== undefined ? json.encryption : existing.encryption,
        username: json.username !== undefined ? json.username : existing.username,
        password: json.password !== undefined ? json.password : existing.password,
        fromEmail: json.fromEmail ?? existing.fromEmail,
        fromName: json.fromName !== undefined ? json.fromName : existing.fromName,
        isActive: json.isActive ?? existing.isActive,
      }
    });

    await addAuditLog(auth, "smtp.updated", "smtpConfig", params.id, { name: updated.name });
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;
    const deny = requirePermission(auth, "smtp:delete");
    if (deny) return deny;

    if (IS_FIREBASE) {
      const configs = await firestore.getSmtpConfigs(auth.userId);
      const existing = configs.find((c: any) => c.id === params.id);
      if (!existing) return Response.json({ error: "Configuration not found" }, { status: 404 });

      await firestore.deleteSmtpConfig(params.id);
      await addAuditLog(auth, "smtp.deleted", "smtpConfig", params.id, { name: existing.name });
      return Response.json({ success: true });
    }

    const existing = await prisma.smtpConfig.findUnique({
      where: { id: params.id, userId: auth.userId }
    });

    if (!existing) return Response.json({ error: "Configuration not found" }, { status: 404 });

    await prisma.smtpConfig.delete({ where: { id: params.id } });
    await addAuditLog(auth, "smtp.deleted", "smtpConfig", params.id, { name: existing.name });
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
