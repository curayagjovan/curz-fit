import type { AppPermission, AppUser } from "@prisma/client";

export const PERMISSION_LABELS: Record<AppPermission, string> = {
  MANAGE_MEMBERS: "Manage Members",
  MANAGE_EXERCISES: "Manage Exercises",
  VIEW_REPORTS: "View Reports",
};

export const ALL_PERMISSIONS = Object.keys(
  PERMISSION_LABELS,
) as AppPermission[];

// Owner always has every permission, regardless of what's stored — the
// permissions array only ever matters for a Member account.
export function hasPermission(
  appUser: Pick<AppUser, "role" | "permissions"> | null | undefined,
  permission: AppPermission,
): boolean {
  if (!appUser) return false;
  return appUser.role === "OWNER" || appUser.permissions.includes(permission);
}
