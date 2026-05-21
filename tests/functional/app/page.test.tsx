import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "@/app/page";
import { AppProviders } from "@/components/providers/app-providers";

function renderPageWithProviders() {
  return render(
    <AppProviders>
      <HomePage />
    </AppProviders>,
  );
}

const authenticatedSession = {
  sub: "supabase-user-1",
  aud: ["authenticated"],
  iss: "https://example.supabase.co/auth/v1",
  exp: "2026-12-31T00:00:00Z",
  profile: {
    id: "user-1",
    email: "learner@yomu.test",
    username: "learner",
    displayName: "Yomu Learner",
    role: "STUDENT",
    isActive: true,
  },
};

function mockAuthFetch(mode: "guest" | "authenticated") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      if (url === "/api/auth-proxy/auth/me" && mode === "guest") {
        return new Response(
          JSON.stringify({ message: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/auth-session" && method === "GET" && mode === "guest") {
        return new Response(JSON.stringify({ authenticated: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/auth-proxy/auth/me" && mode === "authenticated") {
        return new Response(
          JSON.stringify(authenticatedSession),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/auth-session" && method === "GET" && mode === "authenticated") {
        return new Response(JSON.stringify({ authenticated: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/auth-proxy/auth/logout" && method === "POST") {
        return new Response(null, { status: 200 });
      }

      if (url === "/api/auth-session" && method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch call in test: ${method} ${url}`);
    }),
  );
}

describe("HomePage functional behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows guest landing page with hero and CTA buttons", async () => {
    mockAuthFetch("guest");
    renderPageWithProviders();

    expect(screen.getByText("Yomu")).toBeInTheDocument();
    expect(
      screen.getByText(/Baca\. Pahami\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kuasai Informasi\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Platform Pembelajaran Gamifikasi"),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Mulai Belajar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Masuk" })).toBeInTheDocument();
  });

  it("opens login modal when guest clicks Masuk button", async () => {
    mockAuthFetch("guest");
    renderPageWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
  });

  it("opens register modal when guest clicks Mulai Belajar button", async () => {
    mockAuthFetch("guest");
    renderPageWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Mulai Belajar" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("shows features section with all four modules", async () => {
    mockAuthFetch("guest");
    renderPageWithProviders();

    expect(screen.getByText("Kenapa Yomu?")).toBeInTheDocument();
    expect(screen.getByText("Bacaan & Kuis")).toBeInTheDocument();
    expect(screen.getByText("Forum Diskusi")).toBeInTheDocument();
    expect(screen.getByText("Achievements")).toBeInTheDocument();
    expect(screen.getByText("League & Clan")).toBeInTheDocument();
  });

  it("shows CTA section for guests", async () => {
    mockAuthFetch("guest");
    renderPageWithProviders();

    expect(screen.getByText("Siap Meningkatkan Literasimu?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Daftar Sekarang — Gratis" })).toBeInTheDocument();
  });

  it("shows authenticated welcome hero with user name", async () => {
    mockAuthFetch("authenticated");
    renderPageWithProviders();

    expect(await screen.findByText(/Selamat Datang, Yomu Learner!/)).toBeInTheDocument();
    expect(screen.getByText("Lanjutkan perjalanan belajarmu hari ini.")).toBeInTheDocument();
  });

  it("shows authenticated stats section", async () => {
    mockAuthFetch("authenticated");
    renderPageWithProviders();

    expect(await screen.findByText("Streak")).toBeInTheDocument();
    expect(screen.getByText("Skor")).toBeInTheDocument();
    expect(screen.getByText("Misi")).toBeInTheDocument();
  });

  it("hides guest header and CTA section when authenticated", async () => {
    mockAuthFetch("authenticated");
    renderPageWithProviders();

    expect(await screen.findByText(/Selamat Datang, Yomu Learner!/)).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Mulai Belajar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Masuk" })).not.toBeInTheDocument();
    expect(screen.queryByText("Siap Meningkatkan Literasimu?")).not.toBeInTheDocument();
  });

  it("shows guest header with Login and Get Started buttons when not authenticated", async () => {
    mockAuthFetch("guest");
    renderPageWithProviders();

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument();
  });
});
