import { readAccessToken } from "@/lib/auth-client";

export function getAuthHeaders(): HeadersInit {
  const token = readAccessToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
