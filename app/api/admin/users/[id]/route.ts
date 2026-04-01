import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
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
    const body = await request.json();
    const { name, email, role, password } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (IS_FIREBASE) {
      if (!fs.existsSync(DB_PATH)) return Response.json({ error: "DB not found" }, { status: 404 });
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      const idx = db.users.findIndex((u: any) => u.id === params.id);
      if (idx === -1) return Response.json({ error: "User not found" }, { status: 404 });
      
      db.users[idx] = { ...db.users[idx], ...updateData, updatedAt: new Date().toISOString() };
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      
      const { password: _, ...userWithoutPass } = db.users[idx];
      return Response.json({ success: true, user: userWithoutPass });
    }

    // Prisma
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    const { password: _, ...userWithoutPass } = user;
    return Response.json({ success: true, user: userWithoutPass });
  } catch (error) {
    console.error("Update user error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    if (!(await verifyAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  
    try {
      if (IS_FIREBASE) {
          if (!fs.existsSync(DB_PATH)) return Response.json({ error: "DB not found" }, { status: 404 });
          const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
          db.users = db.users.filter((u: any) => u.id !== params.id);
          fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
          return Response.json({ success: true });
      }
  
      await prisma.user.delete({ where: { id: params.id } });
      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
