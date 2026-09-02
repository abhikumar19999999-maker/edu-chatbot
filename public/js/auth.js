const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const saveUserSession = (user) => {
  // Authentication is handled by the HttpOnly edubot_session cookie.
  // This localStorage entry contains display data only.
  localStorage.setItem("edubot_user", JSON.stringify(user));

  // Legacy protected pages use this as a non-secret session marker.
  localStorage.setItem("edubot_token", "cookie-session");
};

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("registerMessage");

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });

      saveUserSession(data.user);
      window.location.href = "/chat.html";
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      saveUserSession(data.user);
      window.location.href = "/chat.html";
    } catch (error) {
      message.textContent = error.message;
    }
  });
}
