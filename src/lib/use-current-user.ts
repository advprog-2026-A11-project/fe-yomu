"use client";

import { useEffect, useState } from "react";
import { readAccessToken, readAuthSnapshot, fetchCurrentSession } from "./auth-client";
import type { AuthSession } from "@/types/auth";

export interface CurrentUser {
  userId: string;
  role: "ADMIN" | "STUDENT" | string;
  profile?: {
    id?: string;
    username?: string;
    displayName?: string;
    email?: string;
  };
}

export function useCurrentUser(): {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
} {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to use cached snapshot
        const snapshot = readAuthSnapshot();
        if (snapshot?.session?.profile?.id) {
          setUser({
            userId: snapshot.session.profile.id,
            role: snapshot.session.profile.role || "STUDENT",
            profile: {
              id: snapshot.session.profile.id,
              username: snapshot.session.profile.username,
              displayName: snapshot.session.profile.displayName,
              email: snapshot.session.profile.email,
            },
          });
          setLoading(false);
          return;
        }

        // If no cached snapshot, try to fetch using access token
        const token = readAccessToken();
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const session: AuthSession = await fetchCurrentSession(token);
          if (session?.profile?.id) {
            setUser({
              userId: session.profile.id,
              role: session.profile.role || "STUDENT",
              profile: {
                id: session.profile.id,
                username: session.profile.username,
                displayName: session.profile.displayName,
                email: session.profile.email,
              },
            });
          } else {
            setUser(null);
          }
        } catch (err) {
          setUser(null);
          setError(`Failed to fetch user session: ${String(err)}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  return { user, loading, error };
}

export function getCurrentUserSync(): CurrentUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const snapshot = readAuthSnapshot();
  if (snapshot?.session?.profile?.id) {
    return {
      userId: snapshot.session.profile.id,
      role: snapshot.session.profile.role || "STUDENT",
      profile: {
        id: snapshot.session.profile.id,
        username: snapshot.session.profile.username,
        displayName: snapshot.session.profile.displayName,
        email: snapshot.session.profile.email,
      },
    };
  }

  return null;
}

export function isUserAdmin(user: CurrentUser | null): boolean {
  return user?.role === "ADMIN";
}

export function isMessageAuthor(user: CurrentUser | null, messageAuthorId?: string): boolean {
  return user?.userId === messageAuthorId;
}

export function canEditMessage(user: CurrentUser | null, messageAuthorId?: string): boolean {
  return isMessageAuthor(user, messageAuthorId);
}

export function canDeleteMessage(user: CurrentUser | null, messageAuthorId?: string): boolean {
  return isUserAdmin(user) || isMessageAuthor(user, messageAuthorId);
}
