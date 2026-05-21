export function isAdminRole(role?: string | null): boolean {
  if (!role) {
    return false;
  }

  const normalized = role.trim().toUpperCase();
  return normalized === "ADMIN" || normalized === "ROLE_ADMIN";
}
