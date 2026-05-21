import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "@/app/page";
import { AppProviders } from "@/components/providers/app-providers";

function renderHomeWithProviders() {
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
      const url = typeof input === "string" ? input : input.toString();
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

describe("AuthModal functional behavior", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  it("does not show modal before user triggers authentication", () => {
    mockAuthFetch("guest");
    renderHomeWithProviders();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens login mode from Masuk button and closes on escape key", async () => {
    mockAuthFetch("guest");
    renderHomeWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByText("Yomu Access")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document.body, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      const dialog = screen.queryByRole("dialog");
      if (dialog) {
        fireEvent(dialog, new Event("cancel", { cancelable: true }));
      }
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe("");
  });

  it("opens register mode from Mulai Belajar button", async () => {
    mockAuthFetch("guest");
    renderHomeWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Mulai Belajar" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("switches modal mode from login to register", async () => {
    mockAuthFetch("guest");
    renderHomeWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await screen.findByText("Welcome Back");

    await userEvent.click(screen.getByRole("button", { name: "Create an account" }));
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("switches modal mode from register to login", async () => {
    mockAuthFetch("guest");
    renderHomeWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Mulai Belajar" }));

    await screen.findByText("Create Account");

    await userEvent.click(screen.getByRole("button", { name: "Sign in instead" }));
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
  });

  it("closes modal from close button", async () => {
    mockAuthFetch("guest");
    renderHomeWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: "Close modal" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows auth reason text inside modal", async () => {
    mockAuthFetch("guest");
    renderHomeWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await screen.findByRole("dialog");

    expect(screen.getByText(/Sign in to continue/)).toBeInTheDocument();
  });
});
