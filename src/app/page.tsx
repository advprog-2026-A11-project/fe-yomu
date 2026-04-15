"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";

const modules = [
  {
    title: "Reading",
    href: "/reading",
  },
  {
    title: "Forums",
    href: "/forums",
  },
  {
    title: "Achievement",
    href: "/achievement",
  },
  {
    title: "Clan",
    href: "/clan",
  },
];

export default function HomePage() {
  const { isAuthenticated, openAuthModal, session, signOut } = useAuth();

  return (
    <main className="home-shell">
      <section className="home-hero">
        <div className="home-center">
          <h1 className="home-title">Yomu</h1>
          <p className="home-subtitle">
            {isAuthenticated
              ? `Signed in as ${session?.profile?.displayName || session?.profile?.username || session?.profile?.email || "Learner"}`
              : "A calmer way to study, read, and keep your progress moving."}
          </p>

          <div className="home-actions">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="button button-primary">
                  Dashboard
                </Link>
                <button type="button" className="button button-ghost" onClick={signOut}>
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button button-primary"
                onClick={() => openAuthModal({ mode: "login", nextPath: "/" })}
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      </section>

      {isAuthenticated ? (
        <section className="home-modules">
          <div className="module-grid module-grid-simple">
            {modules.map((module) => (
              <Link key={module.href} href={module.href} className="module-card module-card-simple">
                <h2>{module.title}</h2>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
