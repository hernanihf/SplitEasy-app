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

export function createApiClient(getToken: () => string | null) {
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = getToken();
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
      const text = await response.text();
      throw new ApiError(response.status, text || response.statusText);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  async function postFormData<T>(path: string, formData: FormData): Promise<T> {
    const token = getToken();
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
