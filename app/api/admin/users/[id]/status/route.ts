import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";
const DB_PATH = path.join(process.cwd(), "tmp", "local_db.json");

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !session.user || (role !== "admin" && role !== "owner")) {
        return false;
    }
    return true;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { status } = await request.json();
    if (!["approved", "pending", "suspended"].includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    if (IS_FIREBASE) {
      if (!fs.existsSync(DB_PATH)) return Response.json({ error: "DB not found" }, { status: 404 });
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      const idx = db.users.findIndex((u: any) => u.id === params.id);
      if (idx === -1) return Response.json({ error: "User not found" }, { status: 404 });
      
      db.users[idx].status = status;
      db.users[idx].updatedAt = new Date().toISOString();
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      
      return Response.json({ success: true, user: db.users[idx] });
    }

    // Prisma
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { status },
    });

    return Response.json({ success: true, user });
  } catch (error) {
    console.error("Update status error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
