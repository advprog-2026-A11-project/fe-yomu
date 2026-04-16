"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

const primaryLinks = [
  { href: "/reading", label: "Reading" },
  { href: "/forums", label: "Forums" },
  { href: "/achievement", label: "Achievement" },
  { href: "/clan", label: "Clan" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, openAuthModal, session, signOut } = useAuth();

  return (
    <header className="site-header">
      <div className="shell shell-header">
        <Link href="/" className="brand-mark">
          <span className="brand-badge">Y</span>
          <span>
            <strong>Yomu</strong>
            <small>Gamified learning</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {primaryLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${isActive ? " nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="button button-secondary nav-action-button">
                Dashboard
              </Link>
              <Link href="/users/account" className="button button-ghost nav-action-button">
                {session?.profile?.displayName || session?.profile?.username || "Account"}
              </Link>
              <button type="button" className="button button-primary nav-action-button" onClick={signOut}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button button-ghost nav-action-button"
                onClick={() => openAuthModal({ mode: "login", nextPath: pathname || "/dashboard" })}
              >
                Login
              </button>
              <button
                type="button"
                className="button button-primary nav-action-button"
                onClick={() => openAuthModal({ mode: "register", nextPath: pathname || "/dashboard" })}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
