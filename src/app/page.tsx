"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/constants";

const features = [
  {
    icon: "📖",
    title: "Bacaan & Kuis",
    description: "Baca teks, jawab kuis, tingkatkan literasi. Setiap bacaan memiliki kategori dan tingkat kesulitan.",
    href: ROUTES.reading.student,
  },
  {
    icon: "💬",
    title: "Forum Diskusi",
    description: "Tukar argumen, bangun pemikiran kritis. Diskusi terstruktur dengan reaksi dan balasan.",
    href: ROUTES.forum,
  },
  {
    icon: "🏆",
    title: "Achievements",
    description: "Raih piala, selesaikan misi harian, dan pamerkan pencapaianmu di profil publik.",
    href: ROUTES.achievement,
  },
  {
    icon: "⚔️",
    title: "League & Clan",
    description: "Bersaing di tier Bronze sampai Diamond. Kontribusi skor clan untuk promosi divisi.",
    href: ROUTES.clan.list,
  },
];

function GuestHeader({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          <span className="site-logo-badge">Y</span>
          <span className="site-logo-text">
            <strong>Yomu</strong>
          </span>
        </Link>

        <div className="site-actions" style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" onClick={onLogin}>
            Login
          </Button>
          <Button variant="primary" size="sm" pill onClick={onRegister}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}

function UnauthenticatedHero({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <section className="hero-section">
      <div className="hero-inner">
        <div className="hero-badge">
          <span>🎯</span>
          <span>Platform Pembelajaran Gamifikasi</span>
        </div>

        <h1 className="hero-title">
          Baca. Pahami.<br />
          <span className="hero-title-accent">Kuasai Informasi.</span>
        </h1>

        <p className="hero-subtitle">
          Platform pembelajaran yang melatih kamu membaca secara saksama
          dan berpikir kritis terhadap informasi di era digital.
        </p>

        <div className="hero-actions">
          <Button variant="primary" size="lg" pill onClick={onRegister}>
            Mulai Belajar
          </Button>
          <Button variant="secondary" size="lg" pill onClick={onLogin}>
            Masuk
          </Button>
        </div>
      </div>
    </section>
  );
}

function AuthenticatedHero({ displayName, email }: { displayName: string; email: string }) {
  return (
    <section className="hero-welcome">
      <div className="hero-welcome-inner">
        <div className="hero-welcome-card">
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Avatar name={displayName} size="xl" />
            <div className="hero-welcome-text">
              <h1>Selamat Datang, {displayName || "Learner"}!</h1>
              <p>Lanjutkan perjalanan belajarmu hari ini.</p>
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">—</div>
              <div className="hero-stat-label">Streak</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">—</div>
              <div className="hero-stat-label">Skor</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">—</div>
              <div className="hero-stat-label">Misi</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="features-section">
      <div className="features-inner">
        <div className="features-header">
          <h2 className="features-title">Kenapa Yomu?</h2>
          <p className="features-subtitle">
            Empat pilar utama untuk membangun kebiasaan literasi yang kuat.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <Card key={feature.title} variant="default" hoverable className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-description">{feature.description}</p>
              <div style={{ marginTop: "1.25rem" }}>
                <Link href={feature.href}>
                  <Button variant="ghost" size="sm">
                    Jelajahi →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ isAuthenticated, onRegister }: { isAuthenticated: boolean; onRegister: () => void }) {
  if (isAuthenticated) return null;

  return (
    <section className="cta-section">
      <div className="cta-inner">
        <h2 className="cta-title">Siap Meningkatkan Literasimu?</h2>
        <p className="cta-description">
          Bergabunglah dengan ribuan pelajar lainnya yang sudah membaca,
          berdiskusi, dan berkompetisi di Yomu.
        </p>
        <Button variant="primary" size="lg" pill onClick={onRegister}>
          Daftar Sekarang — Gratis
        </Button>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { isAuthenticated, openAuthModal, session } = useAuth();
  const displayName = session?.profile?.displayName || session?.profile?.username || "Learner";
  const email = session?.profile?.email || "";

  return (
    <div className="home-page">
      {!isAuthenticated && (
        <GuestHeader
          onLogin={() => openAuthModal({ mode: "login", nextPath: "/" })}
          onRegister={() => openAuthModal({ mode: "register", nextPath: "/" })}
        />
      )}

      {isAuthenticated ? (
        <AuthenticatedHero displayName={displayName} email={email} />
      ) : (
        <UnauthenticatedHero
          onLogin={() => openAuthModal({ mode: "login", nextPath: "/" })}
          onRegister={() => openAuthModal({ mode: "register", nextPath: "/" })}
        />
      )}

      <FeaturesSection />
      <CtaSection
        isAuthenticated={isAuthenticated}
        onRegister={() => openAuthModal({ mode: "register", nextPath: "/" })}
      />
    </div>
  );
}
