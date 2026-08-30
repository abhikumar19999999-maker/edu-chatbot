// ==========================================
// AUTH CHECK
// ==========================================

const token =
  localStorage.getItem("edubot_token");

const storedUser = JSON.parse(
  localStorage.getItem(
    "edubot_user"
  ) || "null"
);

if (!token || !storedUser) {
  window.location.href =
    "/login.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const studentName =
  document.getElementById(
    "studentName"
  );

const totalConversations =
  document.getElementById(
    "totalConversations"
  );

const questionsAsked =
  document.getElementById(
    "questionsAsked"
  );

const botResponses =
  document.getElementById(
    "botResponses"
  );

const averageRating =
  document.getElementById(
    "averageRating"
  );

const ratingValue =
  document.getElementById(
    "ratingValue"
  );

const helpfulAnswers =
  document.getElementById(
    "helpfulAnswers"
  );

const totalFeedback =
  document.getElementById(
    "totalFeedback"
  );

const subjectsCount =
  document.getElementById(
    "subjectsCount"
  );

const subjectsList =
  document.getElementById(
    "subjectsList"
  );

const recentConversations =
  document.getElementById(
    "recentConversations"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


// ==========================================
// USER
// ==========================================

studentName.textContent =
  storedUser.name || "Student";


// ==========================================
// LOAD DASHBOARD
// ==========================================

const loadDashboard = async () => {

  try {

    const data =
      await apiRequest(
        "/dashboard"
      );

    const stats =
      data.stats;


    // --------------------------------------
    // Statistics
    // --------------------------------------

    totalConversations.textContent =
      stats.totalConversations;

    questionsAsked.textContent =
      stats.questionsAsked;

    botResponses.textContent =
      stats.botResponses;

    averageRating.textContent =
      Number(
        stats.averageRating
      ).toFixed(2);

    ratingValue.textContent =
      Number(
        stats.averageRating
      ).toFixed(2);

    helpfulAnswers.textContent =
      stats.helpfulAnswers;

    totalFeedback.textContent =
      stats.totalFeedback;

    subjectsCount.textContent =
      stats.subjectsStudied;


    // --------------------------------------
    // Subjects
    // --------------------------------------

    subjectsList.innerHTML = "";

    if (!data.subjects.length) {

      subjectsList.innerHTML = `
        <div class="empty-state">
          No subjects studied yet.
        </div>
      `;

    } else {

      data.subjects.forEach(
        (subject) => {

          const item =
            document.createElement(
              "div"
            );

          item.className =
            "subject-item";

          item.innerHTML = `
            <div class="subject-icon">
              ${subject.icon || "📚"}
            </div>

            <div>
              <strong>
                ${escapeHTML(subject.name)}
              </strong>

              <span>
                Academic subject
              </span>
            </div>
          `;

          subjectsList.appendChild(
            item
          );
        }
      );
    }


    // --------------------------------------
    // Recent conversations
    // --------------------------------------

    recentConversations.innerHTML =
      "";

    if (
      !data.recentConversations.length
    ) {

      recentConversations.innerHTML = `
        <div class="empty-state">
          No conversations yet.
        </div>
      `;

    } else {

      data.recentConversations.forEach(
        (conversation) => {

          const link =
            document.createElement(
              "a"
            );

          link.className =
            "recent-item";

          link.href =
            `/chat.html?conversation=${conversation.id}`;

          const info =
            document.createElement(
              "div"
            );

          info.className =
            "recent-info";

          const title =
            document.createElement(
              "strong"
            );

          title.textContent =
            conversation.title;

          const subject =
            document.createElement(
              "span"
            );

          subject.textContent =
            conversation.subject
              ? `${conversation.subject.icon || "📚"} ${conversation.subject.name}`
              : "General";

          info.appendChild(title);
          info.appendChild(subject);

          const arrow =
            document.createElement(
              "div"
            );

          arrow.className =
            "recent-arrow";

          arrow.textContent =
            "→";

          link.appendChild(info);
          link.appendChild(arrow);

          recentConversations.appendChild(
            link
          );
        }
      );
    }

  } catch (error) {

    console.error(
      "Dashboard loading failed:",
      error.message
    );

  }
};


// ==========================================
// ESCAPE HTML
// ==========================================

const escapeHTML = (value = "") => {

  const div =
    document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
};


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener(
  "click",
  () => {

    localStorage.removeItem(
      "edubot_token"
    );

    localStorage.removeItem(
      "edubot_user"
    );

    window.location.href =
      "/login.html";
  }
);


// ==========================================
// INITIALIZE
// ==========================================

loadDashboard();