const loginForm =
  document.getElementById("loginForm");

const registerForm =
  document.getElementById("registerForm");


// ======================================
// REGISTER
// ======================================

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const name =
        document.getElementById("name").value.trim();

      const email =
        document.getElementById("email").value.trim();

      const password =
        document.getElementById("password").value;

      const message =
        document.getElementById(
          "registerMessage"
        );

      try {

        const data = await apiRequest(
          "/auth/register",
          {
            method: "POST",

            body: JSON.stringify({
              name,
              email,
              password
            })
          }
        );

        localStorage.setItem(
          "edubot_token",
          data.token
        );

        localStorage.setItem(
          "edubot_user",
          JSON.stringify(data.user)
        );

        window.location.href =
          "/chat.html";

      } catch (error) {

        message.textContent =
          error.message;

      }

    }
  );

}


// ======================================
// LOGIN
// ======================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        document.getElementById("email").value.trim();

      const password =
        document.getElementById("password").value;

      const message =
        document.getElementById(
          "loginMessage"
        );

      try {

        const data = await apiRequest(
          "/auth/login",
          {
            method: "POST",

            body: JSON.stringify({
              email,
              password
            })
          }
        );

        localStorage.setItem(
          "edubot_token",
          data.token
        );

        localStorage.setItem(
          "edubot_user",
          JSON.stringify(data.user)
        );

        window.location.href =
          "/chat.html";

      } catch (error) {

        message.textContent =
          error.message;

      }

    }
  );

}