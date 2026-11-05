export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fields: Record<string, string> };

export async function postJson<T = { redirect?: string; message?: string }>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data };
    return { ok: false, error: data.error ?? "Something went wrong. Try again.", fields: data.fields ?? {} };
  } catch {
    return { ok: false, error: "Can't reach the server. Check your connection.", fields: {} };
  }
}
