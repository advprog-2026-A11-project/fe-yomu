"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/constants";
import Link from "next/link";

const adminLinks = [
  { href: "/admin/users", icon: "👥", label: "User Management" },
  { href: ROUTES.reading.admin, icon: "📚", label: "Reading Admin" },
];

export default function DashboardPage() {
  const { session, isAdmin } = useAuth();
  const profile = session?.profile;
  const quickLinks = [
    { href: isAdmin ? ROUTES.reading.admin : ROUTES.reading.student, icon: "📖", label: "Reading" },
    { href: ROUTES.achievement, icon: "🏆", label: "Achievements" },
    { href: ROUTES.clan.list, icon: "⚔️", label: "League" },
  ];

  return (
    <ProtectedRoute description="Sign in to open your dashboard.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container">
          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Dashboard</p>
            <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Welcome, {profile?.displayName || profile?.username || "Learner"}
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
              Your central hub for learning and progress.
            </p>
          </div>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            {/* Profile Card */}
            <Card variant="raised" padding="lg">
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <Avatar name={profile?.displayName || profile?.username} size="xl" />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>
                    {profile?.displayName || profile?.username || "User"}
                  </h2>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
                    {profile?.email || "No email"}
                  </p>
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {profile?.role && <Badge variant="brand">{profile.role}</Badge>}
                    <Badge variant={profile?.isActive ? "success" : "danger"}>
                      {profile?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Info */}
            <Card>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Account Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
                {[
                  { label: "Username", value: profile?.username },
                  { label: "Email", value: profile?.email },
                  { label: "Phone", value: profile?.phone },
                  { label: "Auth Provider", value: profile?.authProvider },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", fontWeight: 600 }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: "0.25rem", fontWeight: 600, wordBreak: "break-word" }}>
                      {item.value || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Links */}
            <Card>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Quick Links</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                    <Button variant="secondary" pill>{link.icon} {link.label}</Button>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Admin Links */}
            {isAdmin && (
              <Card>
                <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Admin Tools</h3>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {adminLinks.map((link) => (
                    <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                      <Button variant="primary" pill>{link.icon} {link.label}</Button>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
