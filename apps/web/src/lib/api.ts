const configuredApiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(message);
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.error ?? "Không gọi được backend.", response.status, payload);
  }
  return payload as T;
}

async function requestJson<T>(path: string, init?: RequestInit) {
  return readJsonResponse<T>(await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init?.headers
  }));
}

export function getJson<T>(path: string) {
  return requestJson<T>(path);
}

export function postJson<T>(path: string, body: unknown, init?: RequestInit) {
  return requestJson<T>(path, { method: "POST", body: JSON.stringify(body), ...init });
}

export function patchJson<T>(path: string, body: unknown) {
  return requestJson<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteJson<T>(path: string) {
  return requestJson<T>(path, { method: "DELETE" });
}

export function publicApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return configuredApiBaseUrl;
  }

  try {
    const url = new URL(configuredApiBaseUrl);
    const localApiHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const localWebHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (localApiHost && localWebHost) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return configuredApiBaseUrl;
  }

  return configuredApiBaseUrl;
}
