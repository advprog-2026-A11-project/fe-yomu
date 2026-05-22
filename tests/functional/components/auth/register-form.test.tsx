import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/register-form";

const register = vi.fn();

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    register,
    startGoogleSignIn: vi.fn(),
  }),
}));

vi.mock("@/components/auth/google-auth-button", () => ({
  GoogleAuthButton: ({ label }: { label: string }) => (
    <button type="button">{label}</button>
  ),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    register.mockReset();
    register.mockResolvedValue(undefined);
  });

  it("registers with email only by default", async () => {
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("Email"), "learner@yomu.test");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(register).toHaveBeenCalledWith({
      email: "learner@yomu.test",
      phone: undefined,
      password: "password123",
      username: undefined,
      displayName: undefined,
    });
  });

  it("registers with phone only when phone mode is selected", async () => {
    render(<RegisterForm />);

    await userEvent.click(screen.getByRole("tab", { name: "Phone" }));
    await userEvent.type(screen.getByLabelText("Phone number"), "+628123456789");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(register).toHaveBeenCalledWith({
      email: undefined,
      phone: "+628123456789",
      password: "password123",
      username: undefined,
      displayName: undefined,
    });
  });

  it("registers with both email and phone when both mode is selected", async () => {
    render(<RegisterForm />);

    await userEvent.click(screen.getByRole("tab", { name: "Both" }));
    await userEvent.type(screen.getByLabelText("Email"), "learner@yomu.test");
    await userEvent.type(screen.getByLabelText("Phone number"), "+628123456789");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Username"), "learner");
    await userEvent.type(screen.getByLabelText("Display name"), "Yomu Learner");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(register).toHaveBeenCalledWith({
      email: "learner@yomu.test",
      phone: "+628123456789",
      password: "password123",
      username: "learner",
      displayName: "Yomu Learner",
    });
  });
});
