import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const campaignId = searchParams.get("campaignId");
    const contactId = searchParams.get("contactId");

    if (campaignId && contactId) {
      try {
          const recipient = await prisma.campaignRecipient.findUnique({
              where: { campaignId_contactId: { campaignId, contactId } }
          });

          if (recipient) {
              await prisma.campaignRecipient.update({
                  where: { id: recipient.id },
                  data: {
                      clickedAt: new Date(),
                      status: recipient.status === "sent" || recipient.status === "opened" ? "clicked" : recipient.status
                  }
              });
          }
      } catch (e) {
          console.error("Failed to track click", e);
      }
    }

    if (!url) {
        return new NextResponse("Invalid URL", { status: 400 });
    }

    return NextResponse.redirect(url);

  } catch (error) {
    return new NextResponse("Error", { status: 500 });
  }
}
