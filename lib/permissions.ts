/**
 * Client-safe permissions helper.
 * Use this in React components to conditionally show/hide UI elements.
 */

export type UserRole = "owner" | "admin" | "member" | "viewer";

export function canCreateCampaign(role: UserRole): boolean {
  return ["owner", "admin", "member"].includes(role);
}

export function canDeleteCampaign(role: UserRole): boolean {
  return ["owner", "admin"].includes(role);
}

export function canManageContacts(role: UserRole): boolean {
  return ["owner", "admin", "member"].includes(role);
}

export function canDeleteContacts(role: UserRole): boolean {
  return ["owner", "admin"].includes(role);
}

export function canManageLists(role: UserRole): boolean {
  return ["owner", "admin", "member"].includes(role);
}

export function canDeleteLists(role: UserRole): boolean {
  return ["owner", "admin"].includes(role);
}

export function canManageSmtp(role: UserRole): boolean {
  return ["owner", "admin"].includes(role);
}

export function canManageTeam(role: UserRole): boolean {
  return ["owner", "admin"].includes(role);
}

export function canChangeRoles(role: UserRole): boolean {
  return role === "owner";
}

export function canViewAuditLogs(role: UserRole): boolean {
  return ["owner", "admin"].includes(role);
}

export function canManageWorkspace(role: UserRole): boolean {
  return role === "owner";
}

export function isViewer(role: UserRole): boolean {
  return role === "viewer";
}

/** Returns a human-readable label for a role. */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: "Owner",
    admin: "Administrator",
    member: "Member",
    viewer: "Viewer (Read-only)",
  };
  return labels[role] || role;
}

/** Returns tailwind color classes for a role badge. */
export function getRoleBadgeClass(role: UserRole): string {
  const classes: Record<UserRole, string> = {
    owner:  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    admin:  "bg-red-500/20 text-red-300 border-red-500/30",
    member: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    viewer: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };
  return classes[role] || classes.viewer;
}
