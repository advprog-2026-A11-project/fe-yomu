import { beforeEach, describe, expect, it, jest } from "@jest/globals";
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

function setAuthenticatedSnapshot() {
  globalThis.localStorage.setItem("yomu.auth.access-token", "token-123");
  globalThis.localStorage.setItem(
    "yomu.auth.snapshot",
    JSON.stringify({
      token: "token-123",
      session: {
        profile: {
          id: "user-1",
          email: "learner@yomu.test",
          username: "learner",
          displayName: "Yomu Learner",
          role: "STUDENT",
        },
      },
      refreshedAt: Date.now(),
    }),
  );
}

describe("HomePage functional behavior", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    jest.clearAllMocks();
  });

  it("shows guest call-to-action and opens auth modal", async () => {
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
    setAuthenticatedSnapshot();

    renderPageWithProviders();

    expect(await screen.findByText("Signed in as Yomu Learner")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Reading" })).toHaveAttribute("href", "/reading");
    expect(screen.getByRole("link", { name: "Forums" })).toHaveAttribute("href", "/forums");
    expect(screen.getByRole("link", { name: "Achievement" })).toHaveAttribute("href", "/achievement");
    expect(screen.getByRole("link", { name: "Clan" })).toHaveAttribute("href", "/clan");
  });

  it("signs user out from authenticated state", async () => {
    setAuthenticatedSnapshot();

    renderPageWithProviders();

    expect(await screen.findByText("Signed in as Yomu Learner")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Login / Register" })).toBeInTheDocument();
    });

    expect(screen.getByText("You have been signed out.")).toBeInTheDocument();
  });
});
