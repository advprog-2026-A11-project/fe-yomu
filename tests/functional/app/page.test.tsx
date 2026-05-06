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

      if (url === "/api/auth-proxy/auth/me" && mode === "authenticated") {
        return new Response(
          JSON.stringify(authenticatedSession),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
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

  it("shows guest call-to-action and opens auth modal", async () => {
    mockAuthFetch("guest");
    renderPageWithProviders();

    expect(screen.getByText("Yomu")).toBeInTheDocument();
    expect(
      screen.getByText("A calmer way to study, read, and keep your progress moving."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Login / Register" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Continue your learning run")).toBeInTheDocument();
  });

  it("shows authenticated actions and learning modules", async () => {
    mockAuthFetch("authenticated");
    renderPageWithProviders();

    expect(await screen.findByText("Signed in as Yomu Learner")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Reading" })).toHaveAttribute("href", "/reading");
    expect(screen.getByRole("link", { name: "Forums" })).toHaveAttribute("href", "/forums");
    expect(screen.getByRole("link", { name: "Achievement" })).toHaveAttribute("href", "/achievement");
    expect(screen.getByRole("link", { name: "Clan" })).toHaveAttribute("href", "/clan");
  });

  it("signs user out from authenticated state", async () => {
    mockAuthFetch("authenticated");
    renderPageWithProviders();

    expect(await screen.findByText("Signed in as Yomu Learner")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Login / Register" })).toBeInTheDocument();
    });

    expect(screen.getByText("You have been signed out.")).toBeInTheDocument();
  });
});
