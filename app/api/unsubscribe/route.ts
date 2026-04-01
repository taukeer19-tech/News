import { NextResponse as Response } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const campaignId = searchParams.get("campaignId");

    if (!contactId) return Response.json({ error: "contactId is required" }, { status: 400 });

    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });

    await prisma.contact.update({
        where: { id: contactId },
        data: { unsubscribed: true }
    });

    if (campaignId) {
        const recipient = await prisma.campaignRecipient.findUnique({
            where: { campaignId_contactId: { campaignId, contactId } }
        });
        if (recipient) {
            await prisma.campaignRecipient.update({
                where: { id: recipient.id },
                data: { status: "bounced", error: "User Unsubscribed" } // Or set status to unsubscribed if added to schema
            });
        }
    }

    return Response.json({ success: true, message: "Successfully unsubscribed" });
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
