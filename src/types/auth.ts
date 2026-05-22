export type AuthRole = "ADMIN" | "STUDENT" | string;

export type AuthModalMode = "login" | "register";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthProfile {
  id?: string;
  username?: string;
  email?: string;
  phone?: string | null;
  displayName?: string;
  role?: AuthRole;
  authProvider?: string;
  googleSub?: string | null;
  isActive?: boolean;
}

export interface AuthSession {
  sub?: string;
  aud?: string[] | string;
  iss?: string;
  exp?: string;
  profile?: AuthProfile | null;
}

export interface AuthTokenResponse {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: string;
  role?: string;
  authorizationUrl?: string;
  message?: string;
}

export interface UpdateProfileResponse {
  message?: string;
  userId?: string;
  username?: string;
  displayName?: string;
  email?: string | null;
}

export interface UpdateEmailResponse {
  message?: string;
  userId?: string;
  email?: string;
}

export interface UpdatePhoneResponse {
  message?: string;
  userId?: string;
  phone?: string;
}

export interface DeleteAccountResponse {
  message?: string;
  userId?: string;
}

export interface AuthModalIntent {
  mode: AuthModalMode;
  nextPath?: string;
  reason?: string;
}
