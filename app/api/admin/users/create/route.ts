import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import bcrypt from "bcryptjs";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !session.user || (role !== "admin" && role !== "owner")) {
        return false;
    }
    return true;
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, email, role, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (IS_FIREBASE) {
      const user = await firestore.createUser({
        email,
        passwordHash,
        role: role || "member",
        workspaceId: null, // Platform level user, might be assigned later
        name: name || email.split("@")[0],
      });
      
      const { password: _, ...userWithoutPass } = user as any;
      return Response.json({ success: true, user: userWithoutPass }, { status: 201 });
    }

    // Prisma
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: name || null,
        role: role || "member",
        status: "approved",
      },
    });

    const { password: _, ...userWithoutPass } = user as any;
    return Response.json({ success: true, user: userWithoutPass }, { status: 201 });
  } catch (error: any) {
    console.error("Create user error:", error);
    if (error.code === 'P2002' || error.message.includes("exists")) {
        return Response.json({ error: "User with this email already exists" }, { status: 409 });
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
