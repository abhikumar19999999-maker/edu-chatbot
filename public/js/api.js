const API_BASE_URL = "/api";

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("edubot_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    localStorage.removeItem("edubot_token");
    localStorage.removeItem("edubot_user");

    window.location.href = "/login.html";

    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed"
    );
  }

  return data;
};

window.apiRequest = apiRequest;