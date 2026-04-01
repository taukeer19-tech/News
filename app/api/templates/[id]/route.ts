import { NextResponse as Response } from "next/server";
import { requireAuth, addAuditLog } from "@/lib/rbac";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "tmp", "local_db.json");

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) return { templates: [] };
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { templates: [] };
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const db = readDb();
  const template = (db.templates || []).find((t: any) => t.id === params.id && t.userId === auth.userId);
  if (!template) return Response.json({ error: "Template not found" }, { status: 404 });
  return Response.json(template);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;

    const json = await request.json();
    const { name, subject, contentHtml, contentText } = json;

    const db = readDb();
    const idx = (db.templates || []).findIndex((t: any) => t.id === params.id && t.userId === auth.userId);
    if (idx === -1) return Response.json({ error: "Template not found" }, { status: 404 });

    db.templates[idx] = {
      ...db.templates[idx],
      name: name ?? db.templates[idx].name,
      subject: subject ?? db.templates[idx].subject,
      contentHtml: contentHtml ?? db.templates[idx].contentHtml,
      contentText: contentText ?? db.templates[idx].contentText,
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);

    await addAuditLog(auth, "template.updated", "template", params.id, { name });
    return Response.json(db.templates[idx]);
  } catch (error: any) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;

    const db = readDb();
    const idx = (db.templates || []).findIndex((t: any) => t.id === params.id && t.userId === auth.userId);
    if (idx === -1) return Response.json({ error: "Template not found" }, { status: 404 });

    db.templates.splice(idx, 1);
    writeDb(db);

    await addAuditLog(auth, "template.deleted", "template", params.id, {});
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
