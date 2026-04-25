import { useUser } from "@clerk/clerk-react";

export function useRole() {
  const { user } = useUser();
  const role = String(
    user?.publicMetadata?.role || user?.unsafeMetadata?.role || ""
  )
    .trim()
    .toLowerCase();

  return {
    role,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isAdminOrManager: role === "admin" || role === "manager",
  };
}
