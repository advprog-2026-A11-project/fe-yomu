import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountPage from "@/app/users/account/page";
import {
  deleteCurrentAccount,
  updateCurrentEmail,
  updateCurrentPhone,
  updateCurrentProfile,
} from "@/lib/auth-client";

const refreshSession = vi.fn();
const signOut = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

vi.mock("@/lib/auth-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-client")>("@/lib/auth-client");
  return {
    ...actual,
    updateCurrentProfile: vi.fn(),
    updateCurrentEmail: vi.fn(),
    updateCurrentPhone: vi.fn(),
    deleteCurrentAccount: vi.fn(),
  };
});

function createAuthSession(overrides: Record<string, unknown> = {}) {
  return {
    session: {
      profile: {
        id: "user-1",
        username: "learner",
        displayName: "Yomu Learner",
        email: "learner@yomu.test",
        phone: null,
        role: "STUDENT",
        authProvider: "PASSWORD",
        isActive: true,
        ...overrides,
      },
    },
    status: "authenticated",
    isAuthenticated: true,
    refreshSession,
    signOut,
    openAuthModal: vi.fn(),
  };
}

describe("AccountPage", () => {
  beforeEach(() => {
    vi.mocked(updateCurrentProfile).mockReset();
    vi.mocked(updateCurrentEmail).mockReset();
    vi.mocked(updateCurrentPhone).mockReset();
    vi.mocked(deleteCurrentAccount).mockReset();
    refreshSession.mockReset();
    signOut.mockReset();
    mockUseAuth.mockReset();

    vi.mocked(updateCurrentProfile).mockResolvedValue({ message: "Profile updated" });
    vi.mocked(updateCurrentEmail).mockResolvedValue({ message: "Email updated" });
    vi.mocked(updateCurrentPhone).mockResolvedValue({ message: "Phone updated", phone: "+628123456789" });
    vi.mocked(deleteCurrentAccount).mockResolvedValue({ message: "Account deleted" });
    refreshSession.mockResolvedValue(undefined);
    signOut.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(createAuthSession());
  });

  it("updates the current user's public profile", async () => {
    render(<AccountPage />);

    await userEvent.clear(screen.getByLabelText("Display name"));
    await userEvent.type(screen.getByLabelText("Display name"), "Updated Learner");
    await userEvent.click(screen.getByRole("button", { name: "Save Profile" }));

    expect(updateCurrentProfile).toHaveBeenCalledWith({
      username: "learner",
      displayName: "Updated Learner",
    });
    await waitFor(() => expect(refreshSession).toHaveBeenCalled());
  });

  it("shows email as read-only text when user already has one", async () => {
    render(<AccountPage />);

    expect(screen.getAllByText("learner@yomu.test").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /email login/i })).not.toBeInTheDocument();
  });

  it("shows add email form when user has a synthetic phone email", async () => {
    mockUseAuth.mockReturnValue(createAuthSession({
      email: "phone-abc123@phone-login.yomu.example.com",
    }));

    render(<AccountPage />);

    expect(screen.getByLabelText("Add email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Email Login" })).toBeInTheDocument();
  });

  it("updates phone login methods", async () => {
    render(<AccountPage />);

    await userEvent.type(screen.getByLabelText("Add phone number"), "+62 812 3456 789");
    await userEvent.click(screen.getByRole("button", { name: "Add Phone Login" }));

    expect(updateCurrentPhone).toHaveBeenCalledWith({ phone: "+628123456789" });
  });

  it("deletes the current account only after explicit confirmation", async () => {
    render(<AccountPage />);

    await userEvent.type(screen.getByLabelText("Confirmation"), "DELETE");
    await userEvent.click(screen.getByRole("button", { name: "Delete Account" }));

    expect(deleteCurrentAccount).toHaveBeenCalledWith({ confirmation: "DELETE" });
    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });
});
