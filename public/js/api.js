const API_BASE_URL = "/api";

// The backend stores authentication in an HttpOnly cookie.
// Keep a non-sensitive client marker only for legacy page guards
// that still expect edubot_token; the real credential is never stored here.
const ensureSessionMarker = () => {
  const user = localStorage.getItem("edubot_user");

  if (user && !localStorage.getItem("edubot_token")) {
    localStorage.setItem("edubot_token", "cookie-session");
  }
};

ensureSessionMarker();

const clearClientSession = () => {
  localStorage.removeItem("edubot_token");
  localStorage.removeItem("edubot_user");
};

const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "same-origin"
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    clearClientSession();
    window.location.href = "/login.html";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

// All authenticated pages use the same logout button.
// Capture the click before the page-specific legacy handlers so the
// HttpOnly session cookie is actually cleared on the server.
document.addEventListener("click", async (event) => {
  const button = event.target.closest("#logoutBtn");

  if (!button) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  button.disabled = true;

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    clearClientSession();
    window.location.href = "/login.html";
  }
}, true);

window.apiRequest = apiRequest;
window.clearClientSession = clearClientSession;
