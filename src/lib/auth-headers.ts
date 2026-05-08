export function getAuthHeaders(): HeadersInit {
  if (typeof document === "undefined") {
    return {};
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === "yomu-access-token") {
      const token = decodeURIComponent(valueParts.join("="));
      if (token) {
        return {
          Authorization: `Bearer ${token}`,
        };
      }
    }
  }

  return {};
}
