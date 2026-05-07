export async function fetchLiga(endpoint: string, token?: string | null, options: RequestInit = {}) {
    // It will use your .env.local variable, or fallback to localhost:8080 just in case
    const baseUrl = process.env.NEXT_PUBLIC_LIGA_API_URL || 'http://localhost:8080';
    
    // Automatically attach the JSON header and the Bearer token (if provided)
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    return fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });
}