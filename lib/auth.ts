import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

/** Read a user from the local JSON mock database in Firebase dev mode. */
function findUserInMock(email: string): any | null {
  try {
    const dbPath = path.join(process.cwd(), "tmp", "local_db.json");
    if (!fs.existsSync(dbPath)) return null;
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    return (db.users || []).find((u: any) => u.email === email) || null;
  } catch {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        let user: any = null;

        if (IS_FIREBASE) {
          // Use local JSON mock database
          user = findUserInMock(credentials.email);
        } else {
          // Prisma (production)
          user = await prisma.user.findUnique({ where: { email: credentials.email } }) as any;

          // Auto-promote the owner email to 'owner' role
          if (user && user.email === "taukeer@bombinoexp.com" && user.role !== "owner") {
            user = await prisma.user.update({
              where: { email: user.email },
              data: { role: "owner" }
            });
          }
        }

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        // Check user status
        if (user.status === "pending") {
          throw new Error("PENDING_APPROVAL");
        }
        if (user.status === "suspended") {
          throw new Error("ACCOUNT_SUSPENDED");
        }

        return user;
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role || "member";
        token.workspaceId = u.workspaceId || u.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).workspaceId = (token.workspaceId || token.id) as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  }
};
