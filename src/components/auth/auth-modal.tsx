"use client";

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/components/providers/auth-provider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function AuthModal() {
  const { authModal, closeAuthModal, openAuthModal } = useAuth();

  if (!authModal) return null;

  const isLogin = authModal.mode === "login";

  return (
    <Modal
      open={!!authModal}
      onClose={closeAuthModal}
      title={
        <div>
          <p className="yomu-eyebrow" style={{ marginBottom: "0.25rem" }}>Yomu Access</p>
          <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </span>
        </div>
      }
      size="md"
      footer={
        <div className="auth-form-footer" style={{ width: "100%", marginTop: 0 }}>
          <span>
            {isLogin ? "New around here?" : "Already have an account?"}
          </span>
          <button
            type="button"
            className="auth-form-footer-link"
            onClick={() =>
              openAuthModal({
                mode: isLogin ? "register" : "login",
                nextPath: authModal.nextPath,
              })
            }
          >
            {isLogin ? "Create an account" : "Sign in instead"}
          </button>
        </div>
      }
    >
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
        {authModal.reason}
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>
    </Modal>
  );
}
