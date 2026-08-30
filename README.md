# 🎓 EduBot — AI-Powered Educational Chatbot

<p align="center">
  <strong>An intelligent educational assistant powered by NLP, semantic retrieval, vector search and AI.</strong>
</p>

<p align="center">
  <a href="https://edu-chatbot-8zft.onrender.com">
    <img src="https://img.shields.io/badge/Live-Demo-success?style=for-the-badge" alt="Live Demo">
  </a>
  <a href="https://github.com/abhikumar19999999-maker/edu-chatbot">
    <img src="https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github" alt="GitHub">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.x-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-5.x-lightgrey?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vector%20Search-MongoDB%20Atlas-blue" alt="Vector Search">
  <img src="https://img.shields.io/badge/JavaScript-ESM-yellow?logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/Deployment-Render-purple" alt="Render">
</p>

---

## 🌐 Live Application

### 🚀 [Open EduBot](https://edu-chatbot-8zft.onrender.com)

### ❤️ Production Health Check

https://edu-chatbot-8zft.onrender.com/api/health

The production health endpoint confirms:

```json
{
  "success": true,
  "service": "EduBot API",
  "database": "connected",
  "environment": "production"
}
```

---

# 📖 About EduBot

EduBot is a full-stack educational chatbot designed to provide students with accessible, context-aware academic assistance.

The system combines:

- Natural Language Processing
- Knowledge-base retrieval
- Semantic vector search
- Embeddings
- Retrieval-Augmented Generation concepts
- Conversational memory
- User feedback
- JWT authentication
- Administrative management

The core objective is to reduce the difficulty of finding relevant, syllabus-oriented educational information and provide students with a conversational interface for asking academic questions.

The project's academic design is based around the principle of grounding generated answers in curated educational knowledge, reducing the risk of unsupported responses. This RAG-oriented approach is also described in the accompanying project paper. 

---

# 🎯 Problem Statement

Students often encounter academic questions while studying independently, outside normal classroom or faculty-support hours.

Traditional approaches require students to:

```text
Search Google
      ↓
Open multiple websites
      ↓
Filter irrelevant information
      ↓
Check accuracy
      ↓
Find syllabus-relevant material
      ↓
Understand the answer
```

EduBot aims to simplify this process:

```text
Student Question
       ↓
EduBot
       ↓
Relevant Knowledge
       ↓
Contextual Answer
       ↓
Student
```

---

# ✨ Key Features

## 👨‍🎓 Student Features

- 🔐 Secure registration and login
- 🎫 JWT authentication
- 💬 AI-powered chat
- 📚 Subject selection
- 🔎 Knowledge retrieval
- 🧠 Semantic/vector search
- 🗂️ Conversation history
- ➕ New conversation creation
- 💾 Persistent messages
- 👍 Helpful feedback
- 👎 Not helpful feedback
- 🤖 Typing indicator
- 👤 Automatic avatar
- 📱 Responsive interface
- 🚪 Secure logout

---

## 👨‍💼 Admin Features

- 🔐 Admin authentication
- 📊 Admin dashboard
- 👥 User management
- 📚 Subject management
- 🧠 Knowledge-base management
- 💬 Conversation monitoring
- ⭐ Feedback monitoring
- ➕ Add knowledge
- ✏️ Update knowledge
- 🗑️ Delete knowledge
- 🔄 Activate/deactivate knowledge
- 📈 System statistics

---

# 🧠 Core AI / Retrieval Workflow

The central idea is to retrieve relevant educational information before producing an answer.

```mermaid
flowchart TD
    A[👨‍🎓 Student Question] --> B[📝 Query Processing]

    B --> C[🧠 Query Embedding]

    C --> D[(🗄️ MongoDB Atlas)]

    D --> E[🔎 Vector Search]

    E --> F[📚 Relevant Knowledge]

    F --> G[🧩 Context Construction]

    G --> H[🤖 Response Generation]

    H --> I[💬 Final Answer]

    I --> J[⭐ Student Feedback]

    J --> K[📊 Feedback Data]

    K -. Future Improvement .-> E

    style A fill:#e8f1ff
    style I fill:#e8fff0
    style D fill:#fff4e5
    style E fill:#f1e8ff
```

---

# 🏗️ System Architecture

```mermaid
flowchart TB

    U[👨‍🎓 Student]

    subgraph FRONTEND["🌐 Frontend"]
        UI[HTML / CSS / JavaScript]
        AUTH_UI[Login / Register]
        CHAT_UI[Chat Interface]
        DASH[Student Dashboard]
        ADMIN_UI[Admin Panel]
    end

    subgraph BACKEND["⚙️ Node.js Backend"]
        API[Express REST API]

        AUTH[Authentication]
        CHAT[Chat Service]
        SUBJECT[Subject Service]
        KNOW[Knowledge Service]
        FEEDBACK[Feedback Service]
        ADMIN[Admin Service]
        DASHBOARD[Dashboard Service]
    end

    subgraph INTELLIGENCE["🧠 Retrieval & AI"]
        NLP[NLP Processing]
        EMB[Embedding Service]
        RETRIEVE[Retrieval Service]
        AI[AI Response Service]
    end

    DB[(🍃 MongoDB Atlas)]

    VECTOR[🔎 MongoDB Vector Search]

    U --> UI

    UI --> AUTH_UI
    UI --> CHAT_UI
    UI --> DASH
    UI --> ADMIN_UI

    AUTH_UI --> API
    CHAT_UI --> API
    DASH --> API
    ADMIN_UI --> API

    API --> AUTH
    API --> CHAT
    API --> SUBJECT
    API --> KNOW
    API --> FEEDBACK
    API --> ADMIN
    API --> DASHBOARD

    CHAT --> NLP
    NLP --> EMB
    EMB --> RETRIEVE
    RETRIEVE --> VECTOR

    VECTOR --> DB
    KNOW --> DB
    AUTH --> DB
    CHAT --> DB
    FEEDBACK --> DB
    ADMIN --> DB
    DASHBOARD --> DB

    RETRIEVE --> AI
    AI --> CHAT
    CHAT --> API
    API --> CHAT_UI
```

---

# 🔄 Complete Chat Workflow

```mermaid
sequenceDiagram

    actor Student
    participant UI as Chat UI
    participant API as Express API
    participant Auth as JWT Middleware
    participant Chat as Chat Service
    participant Search as Retrieval Service
    participant DB as MongoDB Atlas
    participant AI as AI Service

    Student->>UI: Enter question

    UI->>API: POST /api/chat

    API->>Auth: Validate JWT

    Auth-->>API: User authenticated

    API->>Chat: Process question

    Chat->>Search: Retrieve relevant knowledge

    Search->>DB: Vector search

    DB-->>Search: Relevant documents

    Search-->>Chat: Retrieved context

    Chat->>AI: Generate grounded response

    AI-->>Chat: Answer

    Chat->>DB: Save messages

    Chat-->>API: Response

    API-->>UI: Bot answer

    UI-->>Student: Display answer
```

---

# 🔐 Authentication Workflow

```mermaid
flowchart TD

    A[👤 User] --> B{Has Account?}

    B -- No --> C[📝 Register]

    C --> D[🔒 Hash Password]

    D --> E[(MongoDB Atlas)]

    E --> F[Account Created]

    B -- Yes --> G[🔑 Login]

    F --> G

    G --> H[Verify Credentials]

    H --> I{Valid?}

    I -- No --> J[❌ Invalid Credentials]

    I -- Yes --> K[🎫 Generate JWT]

    K --> L[💾 Store Token]

    L --> M[🔓 Access Protected Routes]

    M --> N[💬 Chat / Dashboard / Feedback]
```

---

# 📚 Knowledge Management Workflow

```mermaid
flowchart LR

    A[👨‍💼 Admin] --> B[Add / Edit Knowledge]

    B --> C[Knowledge Record]

    C --> D[Build Knowledge Text]

    D --> E[Generate Embedding]

    E --> F[(MongoDB Atlas)]

    F --> G[Vector Index]

    G --> H[Semantic Retrieval]

    H --> I[Student Query]
```

---

# 🔎 Vector Search Workflow

```mermaid
flowchart TD

    A[Knowledge Content] --> B[Text Preparation]

    B --> C[Embedding Model]

    C --> D[Vector]

    D --> E[(MongoDB Atlas)]

    E --> F[Vector Search Index]

    G[Student Query] --> H[Query Embedding]

    H --> F

    F --> I[Similarity Search]

    I --> J[Top Relevant Knowledge]

    J --> K[Response Context]
```

---

# 💬 Conversation Workflow

```mermaid
flowchart TD

    A[Start New Chat] --> B[Create Conversation]

    B --> C[Student Message]

    C --> D[Retrieve Knowledge]

    D --> E[Generate Response]

    E --> F[Save User Message]

    F --> G[Save Bot Message]

    G --> H[Display Response]

    H --> I{Continue?}

    I -- Yes --> C

    I -- No --> J[Conversation Stored]
```

---

# ⭐ Feedback Loop

```mermaid
flowchart LR

    A[Bot Response] --> B[Student]

    B --> C{Was it Helpful?}

    C -->|👍 Helpful| D[Positive Feedback]

    C -->|👎 Not Helpful| E[Negative Feedback]

    D --> F[(Feedback Collection)]

    E --> F

    F --> G[Admin Analytics]

    G --> H[Identify Weak Responses]

    H --> I[Improve Knowledge / Retrieval]

    I -.-> A
```

The project paper also describes an iterative feedback mechanism intended to improve response precision over time. 3

---

# ☁️ Production Deployment Architecture

```mermaid
flowchart TB

    DEV[👨‍💻 Developer]

    DEV --> GIT[GitHub]

    GIT --> RENDER[☁️ Render]

    RENDER --> SERVER[Node.js + Express]

    SERVER --> DB[(MongoDB Atlas)]

    SERVER --> VECTOR[MongoDB Vector Search]

    USER[🌍 Student Browser] --> RENDER

    RENDER --> USER
```

---

# 🔄 CI/CD Deployment Workflow

```mermaid
flowchart LR

    A[Code Changes] --> B[git add]

    B --> C[git commit]

    C --> D[git push]

    D --> E[GitHub main]

    E --> F[Render Build]

    F --> G[npm --prefix server ci]

    G --> H[Deploy]

    H --> I[Node server.js]

    I --> J[MongoDB Connection]

    J --> K[/api/health]

    K --> L{Healthy?}

    L -->|Yes| M[🟢 Production]

    L -->|No| N[🔴 Deployment Failure]
```

---

# 🗄️ Database Architecture

EduBot uses MongoDB Atlas for persistent application data.

```mermaid
erDiagram

    USER ||--o{ CONVERSATION : creates

    CONVERSATION ||--o{ MESSAGE : contains

    MESSAGE ||--o| FEEDBACK : receives

    SUBJECT ||--o{ CONVERSATION : categorizes

    SUBJECT ||--o{ KNOWLEDGE : contains

    USER {
        ObjectId _id
        string name
        string email
        string password
        string role
        string avatar
    }

    SUBJECT {
        ObjectId _id
        string name
        string icon
        boolean isActive
    }

    KNOWLEDGE {
        ObjectId _id
        ObjectId subject
        string title
        string question
        string answer
        array keywords
        string topic
        string difficulty
        array embedding
        boolean isActive
    }

    CONVERSATION {
        ObjectId _id
        ObjectId user
        ObjectId subject
        string title
    }

    MESSAGE {
        ObjectId _id
        ObjectId conversation
        string sender
        string content
    }

    FEEDBACK {
        ObjectId _id
        ObjectId message
        ObjectId user
        number rating
        boolean helpful
    }
```

---

# 📁 Project Structure

```text
edu-chatbot/
│
├── public/
│   ├── css/
│   ├── js/
│   │
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── chat.html
│   ├── dashboard.html
│   └── admin.html
│
├── server/
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │
│   ├── data/
│   │   ├── seedSubjects.js
│   │   ├── seedKnowledge.js
│   │   ├── createAdmin.js
│   │   └── generateEmbeddings.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── rateLimitMiddleware.js
│   │
│   ├── models/
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── subjectRoutes.js
│   │   ├── knowledgeRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── feedbackRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── services/
│   │   ├── aiService.js
│   │   ├── embeddingService.js
│   │   ├── retrievalService.js
│   │   └── knowledgeTextService.js
│   │
│   ├── validators/
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── .env.example
├── .gitignore
├── render.yaml
└── README.md
```

---

# 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js |
| API | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT |
| Password Security | bcrypt/bcryptjs |
| NLP | Natural |
| Embeddings | Transformers.js / embedding service |
| Retrieval | MongoDB Vector Search |
| Security | Helmet |
| CORS | Express CORS |
| Rate Limiting | Express Rate Limit |
| Validation | Zod |
| Version Control | Git + GitHub |
| Deployment | Render |

---

# 🔌 API Overview

Production API:

```text
https://edu-chatbot-8zft.onrender.com/api
```

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

## Subjects

```http
GET /api/subjects
```

## Chat

```http
POST /api/chat
GET /api/chat/history
GET /api/chat/:id
```

## Feedback

```http
POST /api/feedback
```

## Dashboard

```http
GET /api/dashboard
```

## Admin

```http
/api/admin/*
```

## Health

```http
GET /api/health
```

---

# 🔑 Authorization

Protected endpoints use JWT authentication.

Send:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Example:

```http
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

# ⚙️ Environment Variables

Create:

```text
server/.env
```

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_atlas_connection_string

JWT_SECRET=your_long_random_secret

NODE_ENV=development
```

If the current AI service requires an external provider, configure its required API credentials as environment variables.

### Never commit:

```text
.env
server/.env
```

Use:

```text
.env.example
```

instead.

---

# 💻 Local Installation

## 1. Clone Repository

```bash
git clone https://github.com/abhikumar19999999-maker/edu-chatbot.git
```

```bash
cd edu-chatbot
```

---

## 2. Enter Server

```bash
cd server
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Configure Environment

Create:

```text
server/.env
```

Add:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
NODE_ENV=development
```

---

## 5. Start Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5000
```

---

# 📦 NPM Commands

Run commands from:

```text
server/
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Seed Subjects

```bash
npm run seed:subjects
```

### Seed Knowledge

```bash
npm run seed:knowledge
```

### Create Admin

```bash
npm run create:admin
```

### Generate Embeddings

```bash
npm run generate:embeddings
```

---

# 🧪 Testing

## Authentication

- [ ] Register new user
- [ ] Login
- [ ] Invalid credentials
- [ ] Logout
- [ ] Protected route without token
- [ ] Protected route with valid token

## Chat

- [ ] Chat page opens
- [ ] Subject list loads
- [ ] Send message
- [ ] Bot responds
- [ ] New conversation
- [ ] Conversation history
- [ ] Reload conversation
- [ ] Multiple messages
- [ ] Feedback buttons

## Admin

- [ ] Admin login
- [ ] Admin dashboard
- [ ] User statistics
- [ ] Subject management
- [ ] Knowledge management
- [ ] Feedback management
- [ ] Unauthorized admin access blocked

## Production

- [ ] Render deployment succeeds
- [ ] `/api/health` works
- [ ] MongoDB reports connected
- [ ] Registration works
- [ ] Login works
- [ ] Chat works
- [ ] Retrieval works
- [ ] Feedback works
- [ ] Admin panel works

---

# 🔒 Security

EduBot implements several backend security practices.

### Helmet

Adds security-related HTTP headers.

### JWT

Protects authenticated API endpoints.

### Password Hashing

Passwords are hashed before storage.

### Rate Limiting

Helps reduce abusive API traffic.

### Validation

Incoming requests are validated before processing.

### Request Limits

JSON and URL-encoded request bodies are restricted to prevent unnecessarily large requests.

### Environment Secrets

Sensitive credentials are kept outside source code.

---

# 🐛 Troubleshooting

## `ENOENT: package.json`

If you see:

```text
Could not read package.json
```

enter the server directory:

```bash
cd server
```

then:

```bash
npm run dev
```

From the project root you can also use:

```bash
npm --prefix server run dev
```

---

## MongoDB Connection Failed

Check:

```text
MONGODB_URI
```

Then verify:

```text
MongoDB Atlas
→ Database Access
→ Network Access
→ Cluster
```

The deployed Render service must be able to reach the Atlas cluster.

---

## JWT Authentication Failed

Check:

```text
JWT_SECRET
```

and make sure the application is using the expected production environment variable.

---

## Chat Not Working

Check the Render logs and verify:

```text
MongoDB connected
JWT authenticated
Chat route reached
Retrieval service working
AI/fallback response service working
```

Then test:

```text
GET /api/health
```

---

# 📊 System Evaluation

The academic design of the project emphasizes three broad evaluation dimensions:

```text
Accuracy & Relevance
        ↓
Response Latency
        ↓
User Satisfaction
```

These dimensions are reflected in the project's evaluation framework. 4

For production claims, however, performance numbers should only be reported after measuring the **current deployed implementation**.

---

# ⚠️ Current Limitations

The system's effectiveness depends heavily on the quality and coverage of its educational knowledge base.

Potential limitations include:

- Incomplete knowledge coverage
- Ambiguous student questions
- Retrieval errors
- AI-generated inaccuracies
- Limited multilingual support
- Computational cost of AI processing
- Need for continued knowledge-base maintenance
- Need for stronger production monitoring

The accompanying academic work similarly identifies knowledge-base dependence, computational resources, ambiguous queries, and data privacy as important challenges. 5

---

# 🚀 Future Improvements

Possible future enhancements include:

### 🌍 Multilingual Support

Support regional languages and multilingual academic questions.

### 🎙️ Voice Assistant

Allow students to ask questions using voice.

### 📄 Document Upload

Allow administrators to upload:

```text
PDF
DOCX
TXT
Lecture Notes
Study Material
```

and automatically build the knowledge base.

### 🧠 Advanced RAG

Introduce:

```text
Chunking
Metadata Filtering
Hybrid Search
Reranking
Context Compression
Citation Generation
```

### 🎓 LMS Integration

Integrate with institutional learning-management systems.

### 🖼️ Multimodal Learning

Support:

```text
Handwritten Notes
Diagrams
Screenshots
Charts
Engineering Problems
```

These directions are consistent with the future-scope themes described in the accompanying paper, including multilingual, voice, LMS, and multimodal capabilities. 6

---

# 🏆 Project Highlights

```text
                EDU-BOT
                   │
       ┌───────────┼───────────┐
       │           │           │
   Frontend     Backend     Database
       │           │           │
   HTML/CSS/JS  Express    MongoDB Atlas
                   │
          ┌────────┴────────┐
          │                 │
        NLP            Vector Search
          │                 │
          └────────┬────────┘
                   │
                  RAG
                   │
                   ▼
             AI Response
```

---

# 📈 Project Development Progress

```text
Frontend                    ████████████████████ 100%
Authentication              ████████████████████ 100%
MongoDB Integration         ████████████████████ 100%
REST API                    ████████████████████ 100%
Chat System                 ████████████████████ 100%
Conversation History        ████████████████████ 100%
Admin Panel                 ████████████████████ 100%
Knowledge Base              ████████████████████ 100%
Embeddings                  ████████████████████ 100%
Vector Search               ████████████████████ 100%
Feedback System             ████████████████████ 100%
Security Middleware         ████████████████████ 100%
Render Deployment           ████████████████████ 100%
```

---

# 🌐 Production Status

| Component | Status |
|---|---|
| Render | 🟢 Online |
| Node.js API | 🟢 Running |
| MongoDB Atlas | 🟢 Connected |
| Authentication | 🟢 Implemented |
| Chat | 🟢 Implemented |
| Conversations | 🟢 Implemented |
| Knowledge Base | 🟢 Implemented |
| Vector Search | 🟢 Implemented |
| Feedback | 🟢 Implemented |
| Admin Panel | 🟢 Implemented |
| Health Check | 🟢 Healthy |

---

# 👨‍💻 Author

## Abhi Kumar

B.Tech — Computer Science & Engineering

### GitHub

https://github.com/abhikumar19999999-maker

### Project Repository

https://github.com/abhikumar19999999-maker/edu-chatbot

### Live Application

https://edu-chatbot-8zft.onrender.com

---

# 📄 Academic Reference

This project is associated with the academic work:

> **Design and Development of an AI-Powered Educational Chatbot Using Natural Language Processing and Machine Learning**

The academic design discusses NLP, semantic retrieval, RAG, Transformer-based generation, feedback-driven improvement, and educational knowledge grounding. 7

---

# 📜 License

This project is currently intended as an educational and portfolio project.

Add a formal open-source license if you plan to distribute the source code publicly.

For example:

```text
MIT License
```

---

# ⭐ Support

If you find the project useful:

⭐ Star the repository  
🐛 Report issues  
💡 Suggest improvements  
🔧 Contribute enhancements

---

<p align="center">
  <strong>Built with ❤️ for smarter and more accessible learning.</strong>
</p>

<p align="center">
  <strong>EduBot — Learn. Ask. Understand. 🚀</strong>
</p>
