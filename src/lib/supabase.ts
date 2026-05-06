"use client";

import {
  createClient,
  SupabaseClient,
  type SupportedStorage,
} from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

function createCookieStorage(): SupportedStorage {
  const cookieAttributes = "path=/; SameSite=Lax";

  function getCookieValue(name: string): string | null {
    if (typeof document === "undefined") {
      return null;
    }

    const encodedName = encodeURIComponent(name);
    const cookie = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${encodedName}=`));

    if (!cookie) {
      return null;
    }

    return decodeURIComponent(cookie.slice(encodedName.length + 1));
  }

  return {
    getItem: (key) => getCookieValue(key),
    setItem: (key, value) => {
      if (typeof document === "undefined") {
        return;
      }

      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; ${cookieAttributes}`;
    },
    removeItem: (key) => {
      if (typeof document === "undefined") {
        return;
      }

      document.cookie = `${encodeURIComponent(key)}=; ${cookieAttributes}; Max-Age=0`;
    },
  };
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: false,
      storageKey: "yomu-supabase-auth",
      storage: createCookieStorage(),
    },
  });
  return supabaseClient;
}
