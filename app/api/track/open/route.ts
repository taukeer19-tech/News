import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { join } from "path";
import { readFileSync } from "fs";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const contactId = searchParams.get("contactId");

    if (campaignId && contactId) {
      try {
          const recipient = await prisma.campaignRecipient.findUnique({
              where: { campaignId_contactId: { campaignId, contactId } }
          });

          if (recipient && !recipient.openedAt) {
              await prisma.campaignRecipient.update({
                  where: { id: recipient.id },
                  data: {
                      openedAt: new Date(),
                      status: recipient.status === "sent" ? "opened" : recipient.status
                  }
              });
          }
      } catch (e) {
          console.error("Failed to track open", e);
      }
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    
    return new NextResponse(pixel, {
        headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    });

  } catch (error) {
    return new NextResponse("Error", { status: 500 });
  }
}
