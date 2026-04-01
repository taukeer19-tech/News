import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "contacts:read");
  if (deny) return deny;

  if (IS_FIREBASE) {
    const contacts = await firestore.getContacts(auth.userId);
    const contact = contacts.find((c: any) => c.id === params.id);
    if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });
    return Response.json(contact);
  }

  const contact = await prisma.contact.findUnique({ where: { id: params.id, userId: auth.userId } });
  if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });
  return Response.json(contact);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "contacts:write");
  if (deny) return deny;

  const json = await request.json();
  const { email, firstName, lastName, customFields, unsubscribed } = json;

  if (IS_FIREBASE) {
    const contacts = await firestore.getContacts(auth.userId);
    const existing = contacts.find((c: any) => c.id === params.id);
    if (!existing) return Response.json({ error: "Contact not found" }, { status: 404 });

    const updated = await firestore.updateContact(params.id, {
      email: email ?? existing.email,
      firstName: firstName ?? existing.firstName,
      lastName: lastName ?? existing.lastName,
      customFields: customFields ?? existing.customFields,
      unsubscribed: unsubscribed ?? existing.unsubscribed,
    });
    await addAuditLog(auth, "contact.updated", "contact", params.id, { email });
    return Response.json(updated);
  }

  const existing = await prisma.contact.findUnique({ where: { id: params.id, userId: auth.userId } });
  if (!existing) return Response.json({ error: "Contact not found" }, { status: 404 });

  const updated = await prisma.contact.update({
    where: { id: params.id },
    data: {
      email: email ?? existing.email,
      firstName: firstName ?? existing.firstName,
      lastName: lastName ?? existing.lastName,
      customFields: customFields ?? existing.customFields,
      unsubscribed: unsubscribed ?? existing.unsubscribed,
    },
  });
  await addAuditLog(auth, "contact.updated", "contact", params.id, { email });
  return Response.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "contacts:delete");
  if (deny) return deny;

  if (IS_FIREBASE) {
    const contacts = await firestore.getContacts(auth.userId);
    const existing = contacts.find((c: any) => c.id === params.id);
    if (!existing) return Response.json({ error: "Contact not found" }, { status: 404 });

    await firestore.deleteContact(params.id);
    await addAuditLog(auth, "contact.deleted", "contact", params.id, { email: existing.email });
    return Response.json({ success: true });
  }

  const existing = await prisma.contact.findUnique({ where: { id: params.id, userId: auth.userId } });
  if (!existing) return Response.json({ error: "Contact not found" }, { status: 404 });

  await prisma.contact.delete({ where: { id: params.id } });
  await addAuditLog(auth, "contact.deleted", "contact", params.id, { email: existing.email });
  return Response.json({ success: true });
}
