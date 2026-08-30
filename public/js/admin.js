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
// ADMIN CHECK
// ==========================================

if (storedUser.role !== "admin") {
  window.location.href =
    "/dashboard.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const totalUsers =
  document.getElementById(
    "totalUsers"
  );

const totalSubjects =
  document.getElementById(
    "totalSubjects"
  );

const totalKnowledge =
  document.getElementById(
    "totalKnowledge"
  );

const totalConversations =
  document.getElementById(
    "totalConversations"
  );

const averageRating =
  document.getElementById(
    "averageRating"
  );

const usersList =
  document.getElementById(
    "usersList"
  );

const feedbackList =
  document.getElementById(
    "feedbackList"
  );

const subjectForm =
  document.getElementById(
    "subjectForm"
  );

const subjectId =
  document.getElementById(
    "subjectId"
  );

const subjectName =
  document.getElementById(
    "subjectName"
  );

const subjectDescription =
  document.getElementById(
    "subjectDescription"
  );

const subjectIcon =
  document.getElementById(
    "subjectIcon"
  );

const subjectSubmitBtn =
  document.getElementById(
    "subjectSubmitBtn"
  );

const cancelSubjectBtn =
  document.getElementById(
    "cancelSubjectBtn"
  );

const subjectMessage =
  document.getElementById(
    "subjectMessage"
  );

const adminSubjectsList =
  document.getElementById(
    "adminSubjectsList"
  );

const knowledgeForm =
  document.getElementById(
    "knowledgeForm"
  );

const knowledgeId =
  document.getElementById(
    "knowledgeId"
  );

const knowledgeSubject =
  document.getElementById(
    "knowledgeSubject"
  );

const knowledgeTitle =
  document.getElementById(
    "knowledgeTitle"
  );

const knowledgeQuestion =
  document.getElementById(
    "knowledgeQuestion"
  );

const knowledgeAnswer =
  document.getElementById(
    "knowledgeAnswer"
  );

const knowledgeKeywords =
  document.getElementById(
    "knowledgeKeywords"
  );

const knowledgeTopic =
  document.getElementById(
    "knowledgeTopic"
  );

const knowledgeDifficulty =
  document.getElementById(
    "knowledgeDifficulty"
  );

const knowledgeSource =
  document.getElementById(
    "knowledgeSource"
  );

const knowledgeSubmitBtn =
  document.getElementById(
    "knowledgeSubmitBtn"
  );

const cancelKnowledgeBtn =
  document.getElementById(
    "cancelKnowledgeBtn"
  );

const knowledgeMessage =
  document.getElementById(
    "knowledgeMessage"
  );

const knowledgeManagementList =
  document.getElementById(
    "knowledgeManagementList"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


// ==========================================
// LOAD DASHBOARD
// ==========================================

const loadDashboard = async () => {

  try {

    const data =
      await apiRequest(
        "/admin/dashboard"
      );

    const stats =
      data.stats;

    totalUsers.textContent =
      stats.totalUsers ?? 0;

    totalSubjects.textContent =
      stats.totalSubjects ?? 0;

    totalKnowledge.textContent =
      stats.totalKnowledge ?? 0;

    totalConversations.textContent =
      stats.totalConversations ?? 0;

    averageRating.textContent =
      Number(
        stats.averageRating ?? 0
      ).toFixed(2);

  } catch (error) {

    console.error(
      "Dashboard error:",
      error.message
    );
  }
};


// ==========================================
// LOAD USERS
// ==========================================

const loadUsers = async () => {

  try {

    const data =
      await apiRequest(
        "/admin/users"
      );

    usersList.innerHTML = "";

    if (!data.users?.length) {

      usersList.innerHTML = `
        <div class="empty-state">
          No users found.
        </div>
      `;

      return;
    }


    data.users
      .slice(0, 10)
      .forEach((user) => {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "admin-row";


        const info =
          document.createElement(
            "div"
          );

        const name =
          document.createElement(
            "strong"
          );

        name.textContent =
          user.name || "Unknown";

        const email =
          document.createElement(
            "small"
          );

        email.textContent =
          user.email || "";


        info.appendChild(name);

        info.appendChild(email);


        const status =
          document.createElement(
            "span"
          );

        status.className =
          `status ${
            user.isActive
              ? "active"
              : "inactive"
          }`;

        status.textContent =
          user.isActive
            ? "Active"
            : "Inactive";


        row.appendChild(info);

        row.appendChild(status);

        usersList.appendChild(row);

      });

  } catch (error) {

    console.error(
      "Users error:",
      error.message
    );

    usersList.innerHTML = `
      <div class="empty-state">
        Unable to load users.
      </div>
    `;
  }
};


// ==========================================
// LOAD FEEDBACK
// ==========================================

const loadFeedback = async () => {

  try {

    const data =
      await apiRequest(
        "/admin/feedback"
      );

    feedbackList.innerHTML = "";

    if (!data.feedback?.length) {

      feedbackList.innerHTML = `
        <div class="empty-state">
          No feedback available.
        </div>
      `;

      return;
    }


    data.feedback
      .slice(0, 10)
      .forEach((feedback) => {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "admin-row";


        const info =
          document.createElement(
            "div"
          );

        const user =
          document.createElement(
            "strong"
          );

        user.textContent =
          feedback.user?.name ||
          "Student";


        const details =
          document.createElement(
            "small"
          );

        details.textContent =
          `Rating: ${feedback.rating}/5 · ${
            feedback.helpful
              ? "Helpful"
              : "Not helpful"
          }`;


        info.appendChild(user);

        info.appendChild(details);

        row.appendChild(info);

        feedbackList.appendChild(
          row
        );

      });

  } catch (error) {

    console.error(
      "Feedback error:",
      error.message
    );
  }
};


// ==========================================
// LOAD SUBJECTS
// ==========================================

let cachedSubjects = [];


const loadSubjects = async () => {

  try {

    const data =
      await apiRequest(
        "/subjects"
      );

    cachedSubjects =
      data.subjects || [];


    // -------------------------------
    // Knowledge subject select
    // -------------------------------

    knowledgeSubject.innerHTML = `
      <option value="">
        Select subject
      </option>
    `;


    cachedSubjects.forEach(
      (subject) => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          subject._id;

        option.textContent =
          `${subject.icon || "📚"} ${subject.name}`;

        knowledgeSubject.appendChild(
          option
        );
      }
    );


    // -------------------------------
    // Admin subject list
    // -------------------------------

    adminSubjectsList.innerHTML =
      "";


    if (!cachedSubjects.length) {

      adminSubjectsList.innerHTML = `
        <div class="empty-state">
          No subjects found.
        </div>
      `;

      return;
    }


    cachedSubjects.forEach(
      (subject) => {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "management-item";


        item.innerHTML = `
          <div class="management-item-header">

            <div>

              <div class="management-item-title">
                ${escapeHTML(
                  subject.icon || "📚"
                )}
                ${escapeHTML(
                  subject.name
                )}
              </div>

              <div class="management-item-description">
                ${escapeHTML(
                  subject.description
                )}
              </div>

            </div>


            <div class="management-actions">

              <button
                type="button"
                class="edit-btn"
                data-action="edit-subject"
                data-id="${subject._id}"
              >
                Edit
              </button>

              <button
                type="button"
                class="delete-btn"
                data-action="delete-subject"
                data-id="${subject._id}"
              >
                Delete
              </button>

            </div>

          </div>
        `;


        adminSubjectsList.appendChild(
          item
        );

      }
    );


  } catch (error) {

    console.error(
      "Subjects error:",
      error.message
    );

    adminSubjectsList.innerHTML = `
      <div class="empty-state">
        Unable to load subjects.
      </div>
    `;
  }
};


// ==========================================
// CREATE / UPDATE SUBJECT
// ==========================================

subjectForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const id =
      subjectId.value.trim();


    const payload = {
      name:
        subjectName.value.trim(),

      description:
        subjectDescription.value.trim(),

      icon:
        subjectIcon.value.trim() ||
        "📚"
    };


    try {

      let data;


      if (id) {

        data =
          await apiRequest(
            `/admin/subjects/${id}`,
            {
              method: "PATCH",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

      } else {

        data =
          await apiRequest(
            "/admin/subjects",
            {
              method: "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );
      }


      subjectMessage.textContent =
        data.message ||
        "Subject saved successfully.";


      subjectMessage.style.color =
        "#78d49a";


      resetSubjectForm();


      await loadSubjects();

      await loadDashboard();


    } catch (error) {

      console.error(
        "Subject save error:",
        error
      );


      subjectMessage.textContent =
        error.message;


      subjectMessage.style.color =
        "#df8c8c";
    }
  }
);


// ==========================================
// EDIT SUBJECT
// ==========================================

adminSubjectsList.addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest(
        "button"
      );


    if (!button) {
      return;
    }


    const action =
      button.dataset.action;

    const id =
      button.dataset.id;


    if (action === "edit-subject") {

      const subject =
        cachedSubjects.find(
          (item) =>
            item._id === id
        );


      if (!subject) {
        return;
      }


      subjectId.value =
        subject._id;

      subjectName.value =
        subject.name;

      subjectDescription.value =
        subject.description;

      subjectIcon.value =
        subject.icon || "📚";


      subjectSubmitBtn.textContent =
        "Update Subject";


      cancelSubjectBtn.classList.remove(
        "hidden"
      );


      subjectForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    }


    if (action === "delete-subject") {

      const confirmed =
        window.confirm(
          "Deactivate this subject?"
        );


      if (!confirmed) {
        return;
      }


      try {

        await apiRequest(
          `/admin/subjects/${id}`,
          {
            method: "DELETE"
          }
        );


        await loadSubjects();

        await loadDashboard();

      } catch (error) {

        console.error(
          "Subject delete error:",
          error
        );

        alert(error.message);
      }

    }
  }
);


// ==========================================
// RESET SUBJECT FORM
// ==========================================

const resetSubjectForm = () => {

  subjectForm.reset();

  subjectId.value = "";

  subjectIcon.value =
    "📚";

  subjectSubmitBtn.textContent =
    "Add Subject";

  cancelSubjectBtn.classList.add(
    "hidden"
  );
};


cancelSubjectBtn.addEventListener(
  "click",
  resetSubjectForm
);


// ==========================================
// LOAD KNOWLEDGE
// ==========================================

let cachedKnowledge = [];


const loadKnowledge = async () => {

  try {

    cachedKnowledge = [];


    knowledgeManagementList.innerHTML =
      "Loading...";


    for (
      const subject of
      cachedSubjects
    ) {

      const data =
        await apiRequest(
          `/knowledge/subject/${subject._id}`
        );


      (data.knowledge || [])
        .forEach((item) => {

          cachedKnowledge.push(item);

        });

    }


    renderKnowledge();


  } catch (error) {

    console.error(
      "Knowledge loading error:",
      error
    );

    knowledgeManagementList.innerHTML = `
      <div class="empty-state">
        Unable to load knowledge.
      </div>
    `;
  }
};


// ==========================================
// RENDER KNOWLEDGE
// ==========================================

const renderKnowledge = () => {

  knowledgeManagementList.innerHTML =
    "";


  if (!cachedKnowledge.length) {

    knowledgeManagementList.innerHTML = `
      <div class="empty-state">
        No knowledge records found.
      </div>
    `;

    return;
  }


  cachedKnowledge.forEach(
    (item) => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "management-item";


      const subjectName =
        item.subject?.name ||
        "Unknown Subject";


      const keywords =
        Array.isArray(
          item.keywords
        )
          ? item.keywords.join(", ")
          : "";


      row.innerHTML = `
        <div class="management-item-header">

          <div>

            <div class="management-item-title">
              ${escapeHTML(
                item.title
              )}
            </div>

            <div class="management-item-description">
              <strong>
                Question:
              </strong>
              ${escapeHTML(
                item.question
              )}
            </div>

            <div class="management-item-description">
              ${escapeHTML(
                item.answer
              )}
            </div>

            <div class="management-item-meta">

              <span>
                📚 ${escapeHTML(
                  subjectName
                )}
              </span>

              <span>
                🎯 ${escapeHTML(
                  item.topic ||
                  "General"
                )}
              </span>

              <span>
                📊 ${escapeHTML(
                  item.difficulty
                )}
              </span>

              ${
                keywords
                  ? `
                    <span>
                      🔑 ${escapeHTML(
                        keywords
                      )}
                    </span>
                  `
                  : ""
              }

            </div>

          </div>


          <div class="management-actions">

            <button
              type="button"
              class="edit-btn"
              data-action="edit-knowledge"
              data-id="${item._id}"
            >
              Edit
            </button>

            <button
              type="button"
              class="delete-btn"
              data-action="delete-knowledge"
              data-id="${item._id}"
            >
              Delete
            </button>

          </div>

        </div>
      `;


      knowledgeManagementList.appendChild(
        row
      );

    }
  );
};


// ==========================================
// CREATE / UPDATE KNOWLEDGE
// ==========================================

knowledgeForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const id =
      knowledgeId.value.trim();


    const keywords =
      knowledgeKeywords.value
        .split(",")
        .map(
          (keyword) =>
            keyword.trim()
        )
        .filter(Boolean);


    const payload = {

      subject:
        knowledgeSubject.value,

      title:
        knowledgeTitle.value.trim(),

      question:
        knowledgeQuestion.value.trim(),

      answer:
        knowledgeAnswer.value.trim(),

      keywords,

      topic:
        knowledgeTopic.value.trim(),

      difficulty:
        knowledgeDifficulty.value,

      source:
        knowledgeSource.value.trim() ||
        "EduBot Knowledge Base"
    };


    try {

      let data;


      if (id) {

        data =
          await apiRequest(
            `/admin/knowledge/${id}`,
            {
              method: "PATCH",

              body:
                JSON.stringify(
                  payload
                )
            }
          );

      } else {

        data =
          await apiRequest(
            "/admin/knowledge",
            {
              method: "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );
      }


      knowledgeMessage.textContent =
        data.message ||
        "Knowledge saved successfully.";


      knowledgeMessage.style.color =
        "#78d49a";


      resetKnowledgeForm();


      await loadKnowledge();

      await loadDashboard();


    } catch (error) {

      console.error(
        "Knowledge save error:",
        error
      );


      knowledgeMessage.textContent =
        error.message;


      knowledgeMessage.style.color =
        "#df8c8c";
    }
  }
);


// ==========================================
// EDIT / DELETE KNOWLEDGE
// ==========================================

knowledgeManagementList.addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest(
        "button"
      );


    if (!button) {
      return;
    }


    const action =
      button.dataset.action;

    const id =
      button.dataset.id;


    const item =
      cachedKnowledge.find(
        (knowledge) =>
          knowledge._id === id
      );


    if (!item) {
      return;
    }


    // --------------------------------------
    // Edit
    // --------------------------------------

    if (
      action ===
      "edit-knowledge"
    ) {

      knowledgeId.value =
        item._id;

      knowledgeSubject.value =
        item.subject?._id ||
        item.subject ||
        "";

      knowledgeTitle.value =
        item.title || "";

      knowledgeQuestion.value =
        item.question || "";

      knowledgeAnswer.value =
        item.answer || "";

      knowledgeKeywords.value =
        Array.isArray(
          item.keywords
        )
          ? item.keywords.join(", ")
          : "";

      knowledgeTopic.value =
        item.topic || "";

      knowledgeDifficulty.value =
        item.difficulty ||
        "beginner";

      knowledgeSource.value =
        item.source ||
        "EduBot Knowledge Base";


      knowledgeSubmitBtn.textContent =
        "Update Knowledge";


      cancelKnowledgeBtn.classList.remove(
        "hidden"
      );


      knowledgeForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    }


    // --------------------------------------
    // Delete
    // --------------------------------------

    if (
      action ===
      "delete-knowledge"
    ) {

      const confirmed =
        window.confirm(
          "Deactivate this knowledge record?"
        );


      if (!confirmed) {
        return;
      }


      try {

        await apiRequest(
          `/admin/knowledge/${id}`,
          {
            method: "DELETE"
          }
        );


        await loadKnowledge();

        await loadDashboard();

      } catch (error) {

        console.error(
          "Knowledge delete error:",
          error
        );

        alert(error.message);
      }

    }
  }
);


// ==========================================
// RESET KNOWLEDGE FORM
// ==========================================

const resetKnowledgeForm = () => {

  knowledgeForm.reset();

  knowledgeId.value = "";

  knowledgeSource.value =
    "EduBot Knowledge Base";

  knowledgeDifficulty.value =
    "beginner";

  knowledgeSubmitBtn.textContent =
    "Add Knowledge";

  cancelKnowledgeBtn.classList.add(
    "hidden"
  );
};


cancelKnowledgeBtn.addEventListener(
  "click",
  resetKnowledgeForm
);


// ==========================================
// ESCAPE HTML
// ==========================================

const escapeHTML = (value = "") => {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value);

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

const initializeAdmin = async () => {

  try {

    await loadDashboard();

    await loadUsers();

    await loadFeedback();

    await loadSubjects();

    await loadKnowledge();

  } catch (error) {

    console.error(
      "Admin initialization failed:",
      error
    );
  }
};


initializeAdmin();