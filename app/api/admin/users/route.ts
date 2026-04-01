import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !session.user || (role !== "admin" && role !== "owner")) {
        return false;
    }
    return true;
}

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";
const DB_PATH = path.join(process.cwd(), "tmp", "local_db.json");

export async function GET() {
  if (!(await verifyAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (IS_FIREBASE) {
      if (!fs.existsSync(DB_PATH)) return Response.json([]);
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      // Add mock counts for usage column
      const users = (db.users || []).map((u: any) => ({
        ...u,
        _count: {
          contacts: (db.contacts || []).filter((c: any) => c.userId === u.id).length,
          campaigns: (db.campaigns || []).filter((c: any) => c.userId === u.id).length,
        }
      }));
      return Response.json(users);
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
          _count: {
              select: { contacts: true, campaigns: true }
          }
      }
    });

    return Response.json(users);
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
