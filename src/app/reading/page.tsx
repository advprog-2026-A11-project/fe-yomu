"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReadingPage() {
    const { isAdmin, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) return;

        if (isAdmin) {
            router.replace("/reading/admin");
        } else {
            router.replace("/reading/student/readings");
        }
    }, [isAdmin, isAuthenticated, router]);

    return <p>Redirecting...</p>;
}