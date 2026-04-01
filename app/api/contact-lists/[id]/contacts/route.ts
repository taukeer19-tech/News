import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";
const IS_DEV = process.env.NODE_ENV === "development";

// Add a contact to a list
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || (IS_DEV ? "test-user-id" : null);

    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const json = await request.json();
    const { contactId } = json;

    if (!contactId) return Response.json({ error: "contactId is required" }, { status: 400 });

    if (IS_FIREBASE) {
        try {
            const relation = await firestore.addContactToList(userId, params.id, contactId);
            return Response.json(relation, { status: 201 });
        } catch (error: any) {
            if (error.code === 'P2002') {
                return Response.json({ error: "Contact is already in this list" }, { status: 409 });
            }
            throw error;
        }
    }

    // Verify list belongs to user
    const list = await prisma.contactList.findUnique({
      where: { id: params.id, userId }
    });
    if (!list) return Response.json({ error: "List not found" }, { status: 404 });

    // Verify contact belongs to user
    const contact = await prisma.contact.findUnique({
      where: { id: contactId, userId }
    });
    if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });

    const relation = await prisma.contactListContact.create({
      data: {
        listId: params.id,
        contactId
      }
    });

    return Response.json(relation, { status: 201 });
  } catch (error: any) {
    console.error("POST List Contact Error:", error);
    if (error.code === 'P2002') {
      return Response.json({ error: "Contact is already in this list" }, { status: 409 });
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Remove a contact from a list
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || (IS_DEV ? "test-user-id" : null);

    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    if (!contactId) return Response.json({ error: "contactId query param is required" }, { status: 400 });

    if (IS_FIREBASE) {
        const removed = await firestore.removeContactFromList(userId, params.id, contactId);
        if (!removed) return Response.json({ error: "Contact is not in this list" }, { status: 404 });
        return Response.json({ success: true });
    }

    // Verify list belongs to user
    const list = await prisma.contactList.findUnique({
      where: { id: params.id, userId }
    });
    if (!list) return Response.json({ error: "List not found" }, { status: 404 });

    // Find and delete relation
    const relations = await prisma.contactListContact.findMany({
      where: { listId: params.id, contactId }
    });

    if (relations.length === 0) {
       return Response.json({ error: "Contact is not in this list" }, { status: 404 });
    }

    await prisma.contactListContact.delete({
      where: { id: relations[0].id }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE List Contact Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
