// ==========================================
// AUTH CHECK
// ==========================================

const token = localStorage.getItem("edubot_token");

const storedUser = JSON.parse(
  localStorage.getItem("edubot_user") || "null"
);

if (!token || !storedUser) {
  window.location.href = "/login.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const chatForm = document.getElementById("chatForm");

const messageInput =
  document.getElementById("messageInput");

const sendBtn =
  document.getElementById("sendBtn");

const chatMessages =
  document.getElementById("chatMessages");

const typingIndicator =
  document.getElementById("typingIndicator");

const subjectSelect =
  document.getElementById("subjectSelect");

const conversationList =
  document.getElementById("conversationList");

const newChatBtn =
  document.getElementById("newChatBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const userName =
  document.getElementById("userName");

const userEmail =
  document.getElementById("userEmail");

const userAvatar =
  document.getElementById("userAvatar");


// ==========================================
// BASIC ELEMENT CHECK
// ==========================================

if (
  !chatForm ||
  !messageInput ||
  !sendBtn ||
  !chatMessages ||
  !typingIndicator ||
  !subjectSelect ||
  !conversationList ||
  !newChatBtn ||
  !logoutBtn
) {
  console.error(
    "EduBot: Required chat elements are missing from chat.html"
  );
  throw new Error(
    "Required chat elements are missing"
  );
}


// ==========================================
// STATE
// ==========================================

let currentConversationId = null;

let isSending = false;


// ==========================================
// URL PARAMETER
// ==========================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const initialConversationId =
  urlParams.get("conversation");


// ==========================================
// USER INFORMATION
// ==========================================

userName.textContent =
  storedUser.name || "Student";

userEmail.textContent =
  storedUser.email || "";

userAvatar.textContent =
  (storedUser.name || "U")
    .charAt(0)
    .toUpperCase();


// ==========================================
// LOAD SUBJECTS
// ==========================================

const loadSubjects = async () => {
  try {

    const data =
      await apiRequest("/subjects");

    subjectSelect.innerHTML = `
      <option value="">
        All Subjects
      </option>
    `;

    data.subjects.forEach((subject) => {

      const option =
        document.createElement("option");

      option.value =
        subject._id;

      option.textContent =
        `${subject.icon || "📚"} ${subject.name}`;

      subjectSelect.appendChild(option);

    });

  } catch (error) {

    console.error(
      "Subject loading failed:",
      error.message
    );

    subjectSelect.innerHTML = `
      <option value="">
        Unable to load subjects
      </option>
    `;
  }
};


// ==========================================
// LOAD CONVERSATIONS
// ==========================================

const loadConversations = async () => {

  try {

    const data =
      await apiRequest("/chat/history");

    conversationList.innerHTML = "";

    if (
      !data.conversations ||
      data.conversations.length === 0
    ) {

      conversationList.innerHTML = `
        <p class="empty-history">
          No conversations yet
        </p>
      `;

      return;
    }


    data.conversations.forEach(
      (conversation) => {

        const button =
          document.createElement("button");

        button.type = "button";

        button.className =
          "conversation-item";


        if (
          conversation._id ===
          currentConversationId
        ) {

          button.classList.add(
            "active"
          );

        }


        const title =
          document.createElement("div");

        title.className =
          "conversation-title";

        title.textContent =
          conversation.title ||
          "New Conversation";


        const subject =
          document.createElement("small");

        subject.className =
          "conversation-subject";

        subject.textContent =
          conversation.subject?.name ||
          "General";


        button.appendChild(title);

        button.appendChild(subject);


        button.addEventListener(
          "click",
          async () => {

            await loadConversation(
              conversation._id
            );

          }
        );


        conversationList.appendChild(
          button
        );

      }
    );

  } catch (error) {

    console.error(
      "Conversation loading failed:",
      error.message
    );

    conversationList.innerHTML = `
      <p class="empty-history">
        Unable to load conversations
      </p>
    `;
  }
};


// ==========================================
// LOAD SINGLE CONVERSATION
// ==========================================

const loadConversation = async (
  conversationId
) => {

  if (!conversationId) {
    return;
  }

  try {

    const data =
      await apiRequest(
        `/chat/${conversationId}`
      );


    currentConversationId =
      conversationId;


    // Update URL without reloading

    const newUrl =
      `/chat.html?conversation=${conversationId}`;

    window.history.replaceState(
      {},
      "",
      newUrl
    );


    // Clear current chat

    chatMessages.innerHTML = "";


    if (
      !data.messages ||
      data.messages.length === 0
    ) {

      chatMessages.innerHTML = `
        <div class="welcome-message">

          <div class="welcome-icon">
            🤖
          </div>

          <h2>
            Start your conversation
          </h2>

          <p>
            Ask an academic question.
          </p>

        </div>
      `;

    } else {

      data.messages.forEach(
        (message) => {

          addMessage(
            message.content,
            message.sender,
            false,
            message.sender === "bot"
              ? message._id
              : null
          );

        }
      );

    }


    // Update subject

    if (
      data.conversation?.subject?._id
    ) {

      subjectSelect.value =
        data.conversation.subject._id;

    } else {

      subjectSelect.value = "";

    }


    scrollToBottom();

    await loadConversations();

  } catch (error) {

    console.error(
      "Conversation loading failed:",
      error
    );

    addMessage(
      "Unable to load this conversation. Please try again.",
      "bot"
    );
  }
};


// ==========================================
// ADD MESSAGE
// ==========================================

const addMessage = (
  content,
  sender,
  scroll = true,
  messageId = null
) => {

  const row =
    document.createElement("div");

  row.className =
    `message-row ${sender}`;


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message-wrapper";


  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  bubble.textContent =
    content || "";


  wrapper.appendChild(bubble);


  // ========================================
  // BOT FEEDBACK
  // ========================================

  if (
    sender === "bot" &&
    messageId
  ) {

    const feedback =
      document.createElement("div");

    feedback.className =
      "message-feedback";


    feedback.innerHTML = `
      <button
        type="button"
        class="feedback-btn"
        data-rating="5"
        data-helpful="true"
        data-message-id="${messageId}"
      >
        👍 Helpful
      </button>

      <button
        type="button"
        class="feedback-btn"
        data-rating="1"
        data-helpful="false"
        data-message-id="${messageId}"
      >
        👎 Not helpful
      </button>
    `;


    wrapper.appendChild(feedback);


    feedback
      .querySelectorAll(".feedback-btn")
      .forEach((button) => {

        button.addEventListener(
          "click",
          async () => {

            await submitMessageFeedback(
              button.dataset.messageId,
              Number(
                button.dataset.rating
              ),
              button.dataset.helpful ===
                "true",
              feedback
            );

          }
        );

      });

  }


  row.appendChild(wrapper);

  chatMessages.appendChild(row);


  if (scroll) {
    scrollToBottom();
  }
};


// ==========================================
// SUBMIT FEEDBACK
// ==========================================

const submitMessageFeedback = async (
  messageId,
  rating,
  helpful,
  feedbackElement
) => {

  try {

    const buttons =
      feedbackElement.querySelectorAll(
        ".feedback-btn"
      );


    buttons.forEach((button) => {
      button.disabled = true;
    });


    await apiRequest(
      "/feedback",
      {
        method: "POST",

        body: JSON.stringify({
          messageId,
          rating,
          helpful
        })
      }
    );


    feedbackElement.innerHTML = `
      <span class="feedback-success">
        Thanks for your feedback!
      </span>
    `;

  } catch (error) {

    console.error(
      "Feedback submission failed:",
      error.message
    );


    feedbackElement.innerHTML = `
      <span class="feedback-error">
        Could not submit feedback.
      </span>
    `;
  }
};


// ==========================================
// SEND MESSAGE
// ==========================================

const sendMessage = async (
  message
) => {

  const cleanMessage =
    message?.trim();


  if (
    !cleanMessage ||
    isSending
  ) {
    return;
  }


  isSending = true;


  sendBtn.disabled = true;

  messageInput.disabled = true;


  // ----------------------------------------
  // Display user message immediately
  // ----------------------------------------

  addMessage(
    cleanMessage,
    "user"
  );


  // ----------------------------------------
  // Show typing indicator
  // ----------------------------------------

  typingIndicator.classList.remove(
    "hidden"
  );


  try {

    const payload = {
      message: cleanMessage
    };


    // Existing conversation

    if (currentConversationId) {

      payload.conversationId =
        currentConversationId;

    }


    // Selected subject

    if (subjectSelect.value) {

      payload.subjectId =
        subjectSelect.value;

    }


    // --------------------------------------
    // Send request
    // --------------------------------------

    const data =
      await apiRequest(
        "/chat",
        {
          method: "POST",

          body:
            JSON.stringify(payload)
        }
      );


    // --------------------------------------
    // Validate response
    // --------------------------------------

    if (
      !data ||
      !data.conversation ||
      !data.conversation.id
    ) {

      throw new Error(
        "Invalid response from chatbot server"
      );

    }


    // --------------------------------------
    // Store conversation ID
    // --------------------------------------

    currentConversationId =
      data.conversation.id;


    // --------------------------------------
    // Update URL
    // --------------------------------------

    window.history.replaceState(
      {},
      "",
      `/chat.html?conversation=${currentConversationId}`
    );


    // --------------------------------------
    // Hide typing indicator
    // --------------------------------------

    typingIndicator.classList.add(
      "hidden"
    );


    // --------------------------------------
    // Display bot response
    // --------------------------------------

    addMessage(
      data.message ||
        "I was unable to generate a response.",
      "bot",
      true,
      data.messageData?.bot?._id ||
        null
    );


    // --------------------------------------
    // Refresh conversations
    // --------------------------------------

    await loadConversations();

  } catch (error) {

    console.error(
      "Chat request failed:",
      error
    );


    typingIndicator.classList.add(
      "hidden"
    );


    addMessage(
      `Sorry, something went wrong: ${error.message}`,
      "bot"
    );

  } finally {

    isSending = false;

    sendBtn.disabled = false;

    messageInput.disabled = false;

    messageInput.focus();
  }
};


// ==========================================
// FORM SUBMIT
// ==========================================

chatForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const message =
      messageInput.value.trim();


    if (!message) {
      return;
    }


    messageInput.value = "";

    messageInput.style.height =
      "auto";


    await sendMessage(message);
  }
);


// ==========================================
// ENTER KEY
// ==========================================

messageInput.addEventListener(
  "keydown",
  (event) => {

    // Enter = send
    // Shift + Enter = new line

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      chatForm.requestSubmit();

    }
  }
);


// ==========================================
// AUTO RESIZE TEXTAREA
// ==========================================

messageInput.addEventListener(
  "input",
  () => {

    messageInput.style.height =
      "auto";


    messageInput.style.height =
      `${Math.min(
        messageInput.scrollHeight,
        150
      )}px`;
  }
);


// ==========================================
// NEW CHAT
// ==========================================

newChatBtn.addEventListener(
  "click",
  async () => {

    currentConversationId = null;


    // Remove conversation parameter

    window.history.replaceState(
      {},
      "",
      "/chat.html"
    );


    // Reset subject

    subjectSelect.value = "";


    // Clear input

    messageInput.value = "";

    messageInput.style.height =
      "auto";


    // Reset chat area

    chatMessages.innerHTML = `
      <div class="welcome-message">

        <div class="welcome-icon">
          🤖
        </div>

        <h2>
          Start a new conversation
        </h2>

        <p>
          Ask me anything related to your
          selected academic subject.
        </p>

      </div>
    `;


    await loadConversations();


    messageInput.focus();
  }
);


// ==========================================
// SUGGESTED QUESTIONS
// ==========================================

document
  .querySelectorAll(
    ".suggestions button"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      async () => {

        const question =
          button.dataset.question;


        if (!question) {
          return;
        }


        await sendMessage(question);
      }
    );

  });


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
// SCROLL TO BOTTOM
// ==========================================

const scrollToBottom = () => {

  setTimeout(() => {

    chatMessages.scrollTop =
      chatMessages.scrollHeight;

  }, 50);
};


// ==========================================
// INITIALIZE CHAT
// ==========================================

const initializeChat = async () => {

  try {

    await loadSubjects();

    await loadConversations();


    // ======================================
    // THIS WAS MISSING IN YOUR VERSION
    // ======================================

    if (initialConversationId) {

      await loadConversation(
        initialConversationId
      );

    }


    messageInput.focus();

  } catch (error) {

    console.error(
      "Chat initialization failed:",
      error
    );

  }
};


initializeChat();