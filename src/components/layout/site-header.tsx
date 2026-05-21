"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

const primaryLinks = [
  { href: "/reading/student/readings", label: "Reading" },
  { href: "/forums", label: "Forum" },
  { href: "/achievement", label: "Achievement" },
  { href: "/clan", label: "League" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, openAuthModal, session, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const displayName = session?.profile?.displayName || session?.profile?.username || "";
  const isAdmin = session?.profile?.role === "ADMIN";

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          <span className="site-logo-badge">Y</span>
          <span className="site-logo-text">
            <strong>Yomu</strong>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          {primaryLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`site-nav-link${isActive ? " site-nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-actions">
          {isAuthenticated ? (
            <div className="site-user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="site-user-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-label="User menu"
              >
                <Avatar name={displayName} size="sm" />
                <span className="site-user-name">{displayName || "Account"}</span>
                <span className="site-user-chevron">{dropdownOpen ? "▾" : "▸"}</span>
              </button>

              {dropdownOpen && (
                <div className="site-dropdown" role="menu">
                  <div className="site-dropdown-header">
                    <Avatar name={displayName} size="md" />
                    <div>
                      <div className="site-dropdown-name">{displayName || "User"}</div>
                      <div className="site-dropdown-email">
                        {session?.profile?.email || "No email"}
                      </div>
                    </div>
                  </div>

                  <div className="site-dropdown-links">
                    <Link
                      href="/dashboard"
                      className="site-dropdown-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/users/account"
                      className="site-dropdown-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Account Settings
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="site-dropdown-divider" />
                        <Link
                          href="/reading/admin"
                          className="site-dropdown-link"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="site-dropdown-footer">
                    <button
                      type="button"
                      className="site-dropdown-logout"
                      onClick={() => {
                        setDropdownOpen(false);
                        void signOut();
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="site-auth-buttons">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal({ mode: "login", nextPath: pathname || "/dashboard" })}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                pill
                onClick={() => openAuthModal({ mode: "register", nextPath: pathname || "/dashboard" })}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
