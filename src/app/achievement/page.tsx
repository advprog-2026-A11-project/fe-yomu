"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";

export default function AchievementPage() {
  const { isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    router.replace(isAdmin ? "/achievement/admin" : "/achievement/student");
  }, [isAdmin, isAuthenticated, router]);

  return (
    <ProtectedRoute description="Masuk ke akun Anda untuk membuka modul achievement.">
      <p>Redirecting...</p>
    </ProtectedRoute>
  );
}
