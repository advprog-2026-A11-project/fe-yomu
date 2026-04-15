"use client";

import { useEffect } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthModal() {
  const { authModal, closeAuthModal, openAuthModal } = useAuth();

  useEffect(() => {
    if (!authModal) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAuthModal();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [authModal, closeAuthModal]);

  if (!authModal) {
    return null;
  }

  const isLogin = authModal.mode === "login";

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeAuthModal();
        }
      }}
    >
      <div
        className="modal-card auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="auth-modal-header">
          <div>
            <p className="eyebrow">Yomu Access</p>
            <h2 id="auth-modal-title">
              {isLogin ? "Continue your learning run" : "Create your Yomu profile"}
            </h2>
            <p>{authModal.reason}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close authentication modal"
            onClick={closeAuthModal}
          >
            ×
          </button>
        </div>

        <div className="auth-modal-content">
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>

        <div className="auth-modal-footer">
          <span>
            {isLogin ? "New around here?" : "Already have an account?"}
          </span>
          <button
            type="button"
            className="text-button"
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
      </div>
    </div>
  );
}
