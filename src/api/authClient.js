const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_API_URL;

async function mockAuthDelay() {
  await new Promise((resolve) => setTimeout(resolve, 800));
}

async function postAuth(path, payload) {
  if (!AUTH_ENDPOINT) {
    await mockAuthDelay();
    return { ok: true, data: { token: "demo-token", user: payload?.email || "demo@local" } };
  }

  const response = await fetch(`${AUTH_ENDPOINT}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Authentication request failed.");
  return response.json();
}

export function signIn(payload) {
  return postAuth("/signin", payload);
}

export function signUp(payload) {
  return postAuth("/signup", payload);
}

export function signOut() {
  return true;
}
