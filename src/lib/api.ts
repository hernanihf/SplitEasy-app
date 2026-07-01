export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

// getToken/onUnauthorized deal with the access token (short-lived, sent as a
// Bearer header). refreshAccessToken is called once on a 401 to try to get a
// fresh access token silently — via the caller's stored refresh token —
// before giving up and treating the session as expired. It should return the
// new access token on success, or null if the session can't be recovered
// (e.g. the refresh token is itself invalid/expired/absent).
export function createApiClient(
  getToken: () => string | null,
  refreshAccessToken: () => Promise<string | null>,
  onUnauthorized?: () => void,
) {
  // tokenOverride, when set, means this call is already a retry after a
  // refresh — it carries the fresh token to use, and also prevents a second
  // refresh attempt if the retried request is unauthorized again.
  async function request<T>(path: string, options: RequestOptions = {}, tokenOverride?: string): Promise<T> {
    const token = tokenOverride ?? getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (tokenOverride === undefined) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return request<T>(path, options, newToken);
          }
        }
        onUnauthorized?.();
      }
      const text = await response.text();
      throw new ApiError(response.status, text || response.statusText);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  async function postFormData<T>(path: string, formData: FormData, tokenOverride?: string): Promise<T> {
    const token = tokenOverride ?? getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Let fetch set the multipart Content-Type (with boundary) itself.
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (tokenOverride === undefined) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return postFormData<T>(path, formData, newToken);
          }
        }
        onUnauthorized?.();
      }
      const text = await response.text();
      throw new ApiError(response.status, text || response.statusText);
    }
    return (await response.json()) as T;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
    postFormData: <T>(path: string, formData: FormData) => postFormData<T>(path, formData),
  };
}
