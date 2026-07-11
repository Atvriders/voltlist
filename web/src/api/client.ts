/**
 * Fetch wrapper for the VoltList API.
 *
 * - Always sends the auth cookie (`credentials: "include"`).
 * - Resolves relative `/api/...` paths against the current origin so the same
 *   code works in the browser and under jsdom/undici (which needs absolute URLs).
 * - Throws a typed {@link ApiError} on non-2xx, carrying status + validation issues.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly issues?: unknown;
  constructor(status: number, message: string, issues?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

function origin(): string {
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.origin &&
    window.location.origin !== "null"
  ) {
    return window.location.origin;
  }
  return "http://localhost";
}

function resolve(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return origin() + (path.startsWith("/") ? path : `/${path}`);
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  /** JSON body — serialized automatically with the correct content-type. */
  json?: unknown;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { json, headers, ...rest } = opts;
  const init: RequestInit = {
    credentials: "include",
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  };
  if (json !== undefined) init.body = JSON.stringify(json);

  const res = await fetch(resolve(path), init);

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const message =
      (isRecord(data) && typeof data.error === "string" && data.error) ||
      res.statusText ||
      `Request failed (${res.status})`;
    const issues = isRecord(data) ? data.issues : undefined;
    throw new ApiError(res.status, message, issues);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
