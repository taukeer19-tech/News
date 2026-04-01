import { NextResponse as Response } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider } = body;

    if (!provider) {
      return Response.json({ error: "Missing provider" }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    try {
      envContent = await fs.readFile(envPath, "utf-8");
    } catch (e) {
      // file might not exist
    }

    // Helper to set or replace an env var line
    const setEnvVar = (content: string, key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*`, "m");
      if (regex.test(content)) return content.replace(regex, `${key}="${value}"`);
      return content + `\n${key}="${value}"`;
    };

    // ─── Firebase (NoSQL — no Prisma) ────────────────────────────────────────
    if (provider === "firebase") {
      const { firebaseProjectId, firebaseApiKey, firebaseServiceAccount } = body;

      if (!firebaseProjectId || !firebaseApiKey || !firebaseServiceAccount) {
        return Response.json({ error: "Missing required Firebase credentials" }, { status: 400 });
      }

      // Validate service account JSON
      try {
        JSON.parse(firebaseServiceAccount);
      } catch {
        return Response.json({ error: "Service Account JSON is not valid JSON." }, { status: 400 });
      }

      envContent = setEnvVar(envContent, "FIREBASE_PROJECT_ID", firebaseProjectId);
      envContent = setEnvVar(envContent, "FIREBASE_API_KEY", firebaseApiKey);
      // Store service account as base64 to avoid newline issues in .env
      const serviceAccountB64 = Buffer.from(firebaseServiceAccount).toString("base64");
      envContent = setEnvVar(envContent, "FIREBASE_SERVICE_ACCOUNT_B64", serviceAccountB64);
      envContent = setEnvVar(envContent, "DB_PROVIDER", "firebase");

      if (!envContent.includes("NEXTAUTH_SECRET=")) {
        envContent += `\nNEXTAUTH_SECRET="${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}"`;
      }
      if (!envContent.includes("NEXTAUTH_URL=")) {
        envContent += `\nNEXTAUTH_URL="http://localhost:3000"`;
      }

      await fs.writeFile(envPath, envContent.trim() + "\n");
      return Response.json({ success: true });
    }

    // ─── SQL Providers (MySQL / SQL Server — use Prisma) ─────────────────────
    const { host, port, database, user, password } = body;

    if (!host || !database || !user || !password) {
      return Response.json({ error: "Missing required database credentials" }, { status: 400 });
    }

    let dbUrl = "";
    if (provider === "mysql") {
      const portStr = port || "3306";
      dbUrl = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${portStr}/${database}`;
    } else if (provider === "sqlserver") {
      const portStr = port || "1433";
      dbUrl = `sqlserver://${host}:${portStr};database=${database};user=${user};password=${password};encrypt=true;trustServerCertificate=true;`;
    } else {
      return Response.json({ error: "Unsupported provider" }, { status: 400 });
    }

    // Write DATABASE_URL to .env
    if (envContent.includes("DATABASE_URL=")) {
      envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${dbUrl}"`);
    } else {
      envContent += `\nDATABASE_URL="${dbUrl}"`;
    }

    if (!envContent.includes("NEXTAUTH_SECRET=")) {
      envContent += `\nNEXTAUTH_SECRET="${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}"`;
    }
    if (!envContent.includes("NEXTAUTH_URL=")) {
      envContent += `\nNEXTAUTH_URL="http://localhost:3000"`;
    }

    await fs.writeFile(envPath, envContent.trim() + "\n");

    // Update prisma/schema.prisma provider
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    let schemaContent = await fs.readFile(schemaPath, "utf-8");
    const datasourceRegex = /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"[^"]+"/;
    schemaContent = schemaContent.replace(datasourceRegex, `$1"${provider}"`);
    await fs.writeFile(schemaPath, schemaContent);

    // Run prisma db push (skip generate — dev server holds lock on Windows)
    try {
      const result = await execAsync(`npx prisma db push --accept-data-loss`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        cwd: process.cwd(),
      });
      console.log("Prisma push output:", result.stdout);
    } catch (pushError: any) {
      const stdout = pushError.stdout || "";
      const stderr = pushError.stderr || "";
      const errorDetail = (stderr + "\n" + stdout).trim() || pushError.message || "Unknown error";
      console.error("Prisma push failed:\n", errorDetail);
      return Response.json({
        error: "Failed to initialize database. Check credentials.",
        details: errorDetail.slice(0, 2000),
      }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Setup error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
