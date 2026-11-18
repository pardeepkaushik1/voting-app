const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export async function apiRequest(
  path,
  { method = "GET", body, requiresAuth = false } = {},
) {
  const headers = new Headers();
  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in before performing this action.");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const responseText = await response.text();
  let responseData;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error(
        `The server returned an invalid response (HTTP ${response.status}).`,
      );
    }
  }

  if (!response.ok) {
    const message =
      responseData?.message ||
      responseData?.error ||
      responseData?.err ||
      `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return responseData;
}
