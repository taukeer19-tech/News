import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "lists:read");
  if (deny) return deny;

  if (IS_FIREBASE) {
    return Response.json(await firestore.getContactLists(auth.userId));
  }
  const lists = await prisma.contactList.findMany({
    where: { userId: auth.userId },
    include: { _count: { select: { contacts: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(lists);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "lists:write");
  if (deny) return deny;

  const { name } = await request.json();
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  if (IS_FIREBASE) {
    const list = await firestore.addContactList(auth.userId, { name });
    await addAuditLog(auth, "list.created", "contactList", list.id, { name });
    return Response.json(list, { status: 201 });
  }
  const list = await prisma.contactList.create({ data: { userId: auth.userId, workspaceId: auth.workspaceId, name } });
  await addAuditLog(auth, "list.created", "contactList", list.id, { name });
  return Response.json(list, { status: 201 });
}
