import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import bcrypt from "bcryptjs";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (IS_FIREBASE) {
      // Use the local JSON mock
      const fs = await import("fs");
      const path = await import("path");
      const dbPath = path.join(process.cwd(), "tmp", "local_db.json");

      let db: any = { users: [], contacts: [], campaigns: [], smtpConfigs: [], contactLists: [], contactListContacts: [], templates: [], auditLogs: [] };
      if (fs.existsSync(dbPath)) {
        db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      }
      if (!db.users) db.users = [];

      // Check if email already exists
      const existing = db.users.find((u: any) => u.email === email);
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      // First user to register becomes the owner
      const isFirst = db.users.length === 0;
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name: name || null,
        password: hashedPassword,
        role: isFirst ? "owner" : "member",
        status: isFirst ? "approved" : "pending",
        workspaceId: isFirst ? `ws_${Date.now()}` : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        message: "Account created successfully. You can now sign in.",
        role: newUser.role,
      }, { status: 201 });
    }

    // Prisma (production) path
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // First user gets 'owner' role
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "owner" : "member";

    const user = await prisma.user.create({
      data: { email, name: name || null, password: hashedPassword, role, status: role === "owner" ? "approved" : "pending" },
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now sign in.",
      role: user.role,
    }, { status: 201 });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
