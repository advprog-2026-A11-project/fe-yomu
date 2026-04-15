"use client";

import { useAuth } from "@/components/providers/auth-provider";

export function UserInfoCard() {
  const { session } = useAuth();
  const profile = session?.profile;

  return (
    <section className="panel-card user-panel">
      <div>
        <p className="eyebrow">Current account</p>
        <h2>{profile?.displayName || profile?.username || "Yomu learner"}</h2>
        <p className="muted-copy">
          Signed in as {profile?.email || "unknown account"} with role{" "}
          <strong>{profile?.role || "STUDENT"}</strong>.
        </p>
      </div>

      <dl className="user-meta-grid">
        <div>
          <dt>User ID</dt>
          <dd>{profile?.id || "-"}</dd>
        </div>
        <div>
          <dt>Username</dt>
          <dd>{profile?.username || "-"}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{profile?.authProvider || "-"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{profile?.isActive ? "Active" : "Inactive"}</dd>
        </div>
      </dl>
    </section>
  );
}
