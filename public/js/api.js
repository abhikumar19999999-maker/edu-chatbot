const API_BASE_URL = "/api";

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
    localStorage.removeItem("edubot_user");
    window.location.href = "/login.html";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

window.apiRequest = apiRequest;
