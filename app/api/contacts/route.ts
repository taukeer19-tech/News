import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const deny = requirePermission(auth, "contacts:read");
  if (deny) return deny;

  const { searchParams } = new URL(request.url);
  const listId = searchParams.get("listId");

  if (IS_FIREBASE) {
    const contacts = await firestore.getContacts(auth.userId, listId || undefined);
    return Response.json(contacts);
  }

  const contacts = await prisma.contact.findMany({
    where: {
      userId: auth.userId,
      ...(listId ? { lists: { some: { listId } } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(contacts);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const deny = requirePermission(auth, "contacts:write");
  if (deny) return deny;

  const json = await request.json();
  const { email, firstName, lastName, customFields } = json;
  if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

  if (IS_FIREBASE) {
    const contact = await firestore.addContact(auth.userId, { email, firstName, lastName, customFields: customFields || {} });
    await addAuditLog(auth, "contact.created", "contact", contact.id, { email });
    return Response.json(contact, { status: 201 });
  }

  try {
    const contact = await prisma.contact.create({
      data: { userId: auth.userId, workspaceId: auth.workspaceId, email, firstName, lastName, customFields: customFields || {} },
    });
    await addAuditLog(auth, "contact.created", "contact", contact.id, { email });
    return Response.json(contact, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") return Response.json({ error: "Contact with this email already exists" }, { status: 409 });
    throw error;
  }
}
