import { NextResponse as Response } from "next/server";
import { requireAuth, requirePermission, addAuditLog } from "@/lib/rbac";
import { firestore } from "@/lib/firestore";
import bcrypt from "bcryptjs";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  
  // To change roles or reset passwords, you generally need 'team:manage' or 'owner' role
  const deny = requirePermission(auth, "team:manage");
  if (deny) return deny;

  try {
    const { role, password } = await request.json();
    const updateData: any = {};
    
    if (role) {
      const validRoles = ["admin", "member", "viewer"];
      if (validRoles.includes(role)) {
        updateData.role = role;
      }
    }
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (IS_FIREBASE) {
      const user = await firestore.updateUser(params.id, updateData);
      if (!user) return Response.json({ error: "User not found" }, { status: 404 });
      
      if (role) await addAuditLog(auth, "member.role_changed", "user", params.id, { role });
      if (password) await addAuditLog(auth, "member.updated", "user", params.id, { action: "password_reset" });
      
      return Response.json({ success: true, user });
    }

    return Response.json({ error: "Not supported" }, { status: 500 });
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  const deny = requirePermission(auth, "team:manage");
  if (deny) return deny;

  if (IS_FIREBASE) {
    const success = await firestore.removeWorkspaceMember(auth.workspaceId, params.id);
    if (!success) return Response.json({ error: "Member not found" }, { status: 404 });
    
    await addAuditLog(auth, "member.removed", "user", params.id);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Not supported" }, { status: 500 });
}
