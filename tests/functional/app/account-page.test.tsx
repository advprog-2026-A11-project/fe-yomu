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

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
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
      },
    },
    status: "authenticated",
    isAuthenticated: true,
    refreshSession,
    signOut,
    openAuthModal: vi.fn(),
  }),
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

describe("AccountPage", () => {
  beforeEach(() => {
    vi.mocked(updateCurrentProfile).mockReset();
    vi.mocked(updateCurrentEmail).mockReset();
    vi.mocked(updateCurrentPhone).mockReset();
    vi.mocked(deleteCurrentAccount).mockReset();
    refreshSession.mockReset();
    signOut.mockReset();

    vi.mocked(updateCurrentProfile).mockResolvedValue({ message: "Profile updated" });
    vi.mocked(updateCurrentEmail).mockResolvedValue({ message: "Email updated" });
    vi.mocked(updateCurrentPhone).mockResolvedValue({ message: "Phone updated", phone: "+628123456789" });
    vi.mocked(deleteCurrentAccount).mockResolvedValue({ message: "Account deleted" });
    refreshSession.mockResolvedValue(undefined);
    signOut.mockResolvedValue(undefined);
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

  it("updates email and phone login methods", async () => {
    render(<AccountPage />);

    await userEvent.clear(screen.getByLabelText("Email"));
    await userEvent.type(screen.getByLabelText("Email"), "new@yomu.test");
    await userEvent.click(screen.getByRole("button", { name: "Update Email Login" }));

    expect(updateCurrentEmail).toHaveBeenCalledWith({ email: "new@yomu.test" });

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
