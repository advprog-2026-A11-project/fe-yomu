import { UsersEntryClient } from "@/components/auth/users-entry-client";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  function readValue(key: string): string | undefined {
    const value = params[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  return (
    <UsersEntryClient
      mode={readValue("mode") === "register" ? "register" : "login"}
      nextPath={readValue("next") || "/dashboard"}
    />
  );
}
