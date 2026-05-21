"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/Avatar";

const primaryLinks = [
  { href: "/", label: "Home" },
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
      if (e.target instanceof Node && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  if (!isAuthenticated) {
    return null;
  }

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
            const isActive = link.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(link.href);
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
                        href="/admin/users"
                        className="site-dropdown-link"
                        onClick={() => setDropdownOpen(false)}
                      >
                        User Management
                      </Link>
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
                      signOut();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
