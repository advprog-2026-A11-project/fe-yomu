import { CallbackClient } from "@/components/auth/callback-client";

export default async function AuthCallbackPage({
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
    <CallbackClient
      code={readValue("code")}
      state={readValue("app_state") || readValue("state")}
      nextPath={readValue("next")}
      oauthError={
        readValue("error_description") ||
        readValue("error_code") ||
        readValue("error")
      }
    />
  );
}
