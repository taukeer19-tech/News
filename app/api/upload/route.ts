import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth } from "@/lib/rbac";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const path = join(uploadDir, uniqueName);
    await writeFile(path, buffer);

    return NextResponse.json({
      success: true,
      name: file.name,
      url: `/uploads/${uniqueName}`,
      path: path,
      type: file.type,
      size: file.size
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
