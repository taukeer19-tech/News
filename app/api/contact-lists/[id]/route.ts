import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "lists:read");
  if (deny) return deny;

  if (IS_FIREBASE) {
    const list = await firestore.getContactListById(auth.userId, params.id);
    if (!list) return Response.json({ error: "List not found" }, { status: 404 });
    return Response.json(list);
  }
  const list = await prisma.contactList.findUnique({
    where: { id: params.id, userId: auth.userId },
    include: { contacts: { include: { contact: true } } },
  });
  if (!list) return Response.json({ error: "List not found" }, { status: 404 });
  return Response.json(list);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "lists:write");
  if (deny) return deny;

  const { name } = await request.json();

  if (IS_FIREBASE) {
    const updated = await firestore.updateContactList(auth.userId, params.id, { name });
    if (!updated) return Response.json({ error: "List not found" }, { status: 404 });
    await addAuditLog(auth, "list.updated", "contactList", params.id, { name });
    return Response.json(updated);
  }
  const existing = await prisma.contactList.findUnique({ where: { id: params.id, userId: auth.userId } });
  if (!existing) return Response.json({ error: "List not found" }, { status: 404 });
  const updated = await prisma.contactList.update({ where: { id: params.id }, data: { name: name ?? existing.name } });
  await addAuditLog(auth, "list.updated", "contactList", params.id, { name });
  return Response.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "lists:delete");
  if (deny) return deny;

  if (IS_FIREBASE) {
    await firestore.deleteContactList(auth.userId, params.id);
  } else {
    const existing = await prisma.contactList.findUnique({ where: { id: params.id, userId: auth.userId } });
    if (!existing) return Response.json({ error: "List not found" }, { status: 404 });
    await prisma.contactList.delete({ where: { id: params.id } });
  }
  await addAuditLog(auth, "list.deleted", "contactList", params.id);
  return Response.json({ success: true });
}
