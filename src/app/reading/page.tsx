"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReadingPage() {
    const { isAdmin, isAuthenticated, status } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return; // tunggu auth selesai dulu

        if (!isAuthenticated) {
            router.replace("/"); // kalau belum login, balik ke home
            return;
        }

        if (isAdmin) {
            router.replace("/reading/admin");
        } else {
            router.replace("/reading/student/readings");
        }
    }, [isAdmin, isAuthenticated, status, router]);

    if (status === "loading") return <p>Loading...</p>;

    return <p>Redirecting...</p>;
}