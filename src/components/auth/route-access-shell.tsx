"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/users/account",
  "/reading",
  "/forums",
  "/achievement",
  "/clan",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function RouteAccessShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    if (!pathname || !isProtectedPath(pathname)) {
      return;
    }

    if (status === "unauthenticated" && !isAuthenticated) {
      openAuthModal({
        mode: "login",
        nextPath: pathname,
        reason: "Sign in first to continue into Yomu.",
      });
      router.replace("/");
    }
  }, [isAuthenticated, openAuthModal, pathname, router, status]);

  return <>{children}</>;
}
