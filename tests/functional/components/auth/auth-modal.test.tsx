import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
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

describe("AuthModal functional behavior", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    jest.clearAllMocks();
    document.body.style.overflow = "";
  });

  it("does not show modal before user triggers authentication", () => {
    renderHomeWithProviders();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens login mode and closes on escape key", async () => {
    renderHomeWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Login / Register" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Continue your learning run")).toBeInTheDocument();
    expect(screen.getByText("or sign in with your account")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(globalThis, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("switches modal mode and closes from close button", async () => {
    renderHomeWithProviders();

    await userEvent.click(screen.getByRole("button", { name: "Login / Register" }));

    await userEvent.click(screen.getByRole("button", { name: "Create an account" }));
    expect(screen.getByText("Create your Yomu profile")).toBeInTheDocument();
    expect(screen.getByText("or create an account with email")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close authentication modal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
