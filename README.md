# 🎓 EduBot — AI-Powered Educational Chatbot

EduBot is a full-stack AI-powered educational chatbot designed to help students ask academic questions, retrieve relevant knowledge, maintain conversations, and receive feedback on answers.

The application combines a modern student-facing chat interface with an administrator dashboard for managing subjects, educational knowledge, users, conversations, and feedback.

## 🌐 Live Demo

**Live Application:**  
https://edu-chatbot-8zft.onrender.com

**API Health Check:**  
https://edu-chatbot-8zft.onrender.com/api/health

The production API currently reports:

```json
{
  "success": true,
  "service": "EduBot API",
  "database": "connected",
  "environment": "production"
}
```

---

# ✨ Features

## 👨‍🎓 Student Features

- Student registration
- Secure login
- JWT-based authentication
- Student dashboard
- AI-powered educational chat
- Subject selection
- Suggested questions
- Conversation history
- Start new conversations
- Persistent conversations
- Responsive chat interface
- Bot typing indicator
- Message feedback
- Helpful / Not Helpful feedback
- Automatic user avatar
- Logout functionality

---

## 👨‍💼 Admin Features

- Secure administrator authentication
- Admin dashboard
- User management
- Subject management
- Knowledge-base management
- Conversation monitoring
- Feedback monitoring
- Educational content management
- Knowledge record creation
- Knowledge record updating
- Knowledge record deletion
- Knowledge activation/deactivation
- Statistics and dashboard information

---

# 🧠 Intelligent Retrieval System

EduBot uses a retrieval-based architecture to improve the relevance of educational responses.

The knowledge pipeline is approximately:

```text
Student Question
       ↓
Text Processing
       ↓
Query Embedding
       ↓
MongoDB Vector Search
       ↓
Relevant Knowledge
       ↓
Response Generation
       ↓
Student
```

The system can retrieve semantically related knowledge instead of relying only on exact keyword matches.

---

# 🔎 Vector Search

Educational knowledge records can contain vector embeddings.

The vector search pipeline uses:

```text
Knowledge
   ↓
Text preparation
   ↓
Embedding generation
   ↓
Vector storage
   ↓
MongoDB Atlas
   ↓
Vector Search
```

Existing knowledge vectors are stored in MongoDB Atlas.

New knowledge can be processed and embedded through the application's embedding service.

---

# 🧮 Embeddings

The project uses local embedding generation through Transformers.js rather than depending on OpenAI for embedding generation.

This was intentionally designed so that the embedding pipeline does not require OpenAI API credits.

The architecture is:

```text
Educational Text
       ↓
Transformers.js
       ↓
Embedding Vector
       ↓
MongoDB Atlas
```

---

# 🤖 AI Response System

EduBot separates retrieval from response generation.

Conceptually:

```text
User Question
      ↓
Retrieve relevant knowledge
      ↓
Build context
      ↓
Generate educational response
      ↓
Return answer
```

This makes the application easier to extend with different AI providers or response strategies.

---

# 🧰 Technology Stack

## Frontend

- HTML5
- CSS3
- JavaScript
- Fetch API
- Local Storage
- Responsive UI

## Backend

- Node.js
- Express.js
- REST API
- JWT authentication
- bcrypt/bcryptjs password hashing
- Helmet
- CORS
- Express Rate Limit
- Zod validation

## Database

- MongoDB
- MongoDB Atlas
- Mongoose
- MongoDB Atlas Vector Search

## NLP / Retrieval

- Natural
- TF-IDF
- Transformers.js
- Vector embeddings
- Semantic retrieval

## Deployment

- GitHub
- Render
- MongoDB Atlas

---

# 🏗️ Project Architecture

```text
edu-chatbot/
│
├── public/
│   │
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── chat.html
│   ├── dashboard.html
│   ├── admin.html
│   │
│   ├── css/
│   │
│   ├── js/
│   │
│   └── assets/
│
├── server/
│   │
│   ├── server.js
│   │
│   ├── package.json
│   ├── package-lock.json
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │
│   ├── middleware/
│   │
│   ├── models/
│   │
│   ├── routes/
│   │
│   ├── services/
│   │
│   ├── validators/
│   │
│   └── data/
│
├── .env.example
├── .gitignore
├── render.yaml
└── README.md
```

---

# 📁 Backend Structure

```text
server/
│
├── server.js
│
├── config/
│   └── database.js
│
├── controllers/
│   ├── authController.js
│   ├── chatController.js
│   ├── dashboardController.js
│   ├── feedbackController.js
│   ├── knowledgeController.js
│   └── subjectController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── validationMiddleware.js
│   └── rateLimitMiddleware.js
│
├── models/
│   ├── User.js
│   ├── Subject.js
│   ├── Knowledge.js
│   ├── Conversation.js
│   ├── Message.js
│   └── Feedback.js
│
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── dashboardRoutes.js
│   ├── feedbackRoutes.js
│   ├── knowledgeRoutes.js
│   ├── subjectRoutes.js
│   └── adminRoutes.js
│
├── services/
│   ├── aiService.js
│   ├── embeddingService.js
│   ├── retrievalService.js
│   └── knowledgeTextService.js
│
├── validators/
│   ├── authValidators.js
│   ├── chatValidators.js
│   └── feedbackValidators.js
│
└── data/
    ├── seedSubjects.js
    ├── seedKnowledge.js
    ├── createAdmin.js
    └── generateEmbeddings.js
```

---

# 🔐 Authentication

EduBot uses JWT-based authentication.

Authentication flow:

```text
Register
   ↓
Password hashing
   ↓
MongoDB
   ↓
Login
   ↓
JWT token
   ↓
Browser localStorage
   ↓
Authorization: Bearer TOKEN
   ↓
Protected API
```

Protected routes verify the JWT before allowing access.

Example:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Passwords are never stored as plain text.

---

# 🛡️ Security

The backend includes several security measures.

### Helmet

Security-related HTTP headers are configured using Helmet.

### Rate Limiting

API requests are rate limited to reduce abuse.

Different limits can be applied to:

```text
General API
Authentication
Chat
```

### Request Validation

Zod validates incoming request bodies.

Invalid requests are rejected before reaching the controllers.

### Request Size Limits

JSON and URL-encoded requests are limited to:

```text
1 MB
```

### Password Security

Passwords are hashed before being stored.

### JWT

Protected resources require a valid authentication token.

### Environment Variables

Sensitive configuration is stored in environment variables.

---

# 🌐 API Endpoints

Base URL:

```text
https://edu-chatbot-8zft.onrender.com/api
```

---

## Authentication

### Register

```http
POST /api/auth/register
```

Example:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Login

```http
POST /api/auth/login
```

Example:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

# 📚 Subjects

### Get subjects

```http
GET /api/subjects
```

Authentication requirements depend on the route implementation.

---

# 💬 Chat

### Send message

```http
POST /api/chat
```

Header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

Example:

```json
{
  "message": "What is supervised learning?"
}
```

Optional:

```json
{
  "message": "What is supervised learning?",
  "subjectId": "SUBJECT_ID",
  "conversationId": "CONVERSATION_ID"
}
```

---

### Conversation history

```http
GET /api/chat/history
```

Requires authentication.

---

### Get conversation

```http
GET /api/chat/:id
```

Requires authentication.

---

# 👍 Feedback

### Submit feedback

```http
POST /api/feedback
```

Example:

```json
{
  "messageId": "MESSAGE_ID",
  "rating": 5,
  "helpful": true
}
```

---

### Get user feedback

```http
GET /api/feedback/mine
```

Requires authentication.

---

# 📊 Dashboard

Dashboard endpoints provide student-related statistics and information.

```http
GET /api/dashboard
```

The exact available dashboard routes depend on the current dashboard route implementation.

---

# 👨‍💼 Admin API

Administrative endpoints are protected and should only be accessible to authorized administrators.

Typical operations include:

```text
Users
Subjects
Knowledge
Feedback
Conversations
Statistics
```

---

# ❤️ Health Check

The production health endpoint is:

```http
GET /api/health
```

Example response:

```json
{
  "success": true,
  "service": "EduBot API",
  "database": "connected",
  "environment": "production",
  "uptime": 1180.09,
  "timestamp": "2026-08-30T07:18:57.671Z"
}
```

This endpoint can also be used by Render to determine whether the service is healthy.

---

# ⚙️ Environment Variables

Create a local:

```text
server/.env
```

Example:

```env
PORT=5000

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE

JWT_SECRET=your_long_random_secret

NODE_ENV=development
```

If an external AI provider is enabled by the current `aiService.js`, configure its required API variables as well.

---

# 🚨 Environment Variable Security

Never commit:

```text
.env
server/.env
```

to GitHub.

Use:

```text
.env.example
```

for documenting required variables.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret

NODE_ENV=production
```

---

# 💻 Local Development

## 1. Clone the repository

```bash
git clone https://github.com/abhikumar19999999-maker/edu-chatbot.git
```

Enter the project:

```bash
cd edu-chatbot
```

---

## 2. Install backend dependencies

Because the backend has its own package.json:

```bash
cd server
```

Then:

```bash
npm install
```

---

## 3. Configure environment variables

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

## 4. Start development server

From:

```text
edu-chatbot/server
```

run:

```bash
npm run dev
```

The server should start at:

```text
http://localhost:5000
```

---

# 🚀 Production Start

From the project root:

```bash
npm --prefix server start
```

Or from inside `server`:

```bash
npm start
```

---

# 📦 Available NPM Scripts

Run these commands inside:

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

### Seed subjects

```bash
npm run seed:subjects
```

### Seed knowledge

```bash
npm run seed:knowledge
```

### Create administrator

```bash
npm run create:admin
```

### Fix administrator

```bash
npm run fix:admin
```

### Generate embeddings

```bash
npm run generate:embeddings
```

---

# 🧠 Knowledge Base

Knowledge records are stored in MongoDB.

A knowledge record can contain educational information such as:

```text
Title
Subject
Content
Keywords
Active status
Embedding
```

The knowledge text is converted into an embedding before vector search.

---

# 🔢 Embedding Generation

To generate embeddings for existing active knowledge records:

```bash
npm run generate:embeddings
```

The process:

```text
MongoDB
   ↓
Active Knowledge Records
   ↓
Build Knowledge Text
   ↓
Embedding Service
   ↓
Vector
   ↓
MongoDB
```

The script processes records in batches.

---

# 🗄️ MongoDB Atlas

EduBot uses MongoDB Atlas as its cloud database.

MongoDB stores:

```text
Users
Subjects
Knowledge
Conversations
Messages
Feedback
Embeddings
```

The application connects using:

```env
MONGODB_URI=...
```

---

# 🔍 MongoDB Vector Search

The vector-search functionality requires the appropriate MongoDB Atlas vector index configuration.

Conceptually:

```text
Embedding
   ↓
MongoDB Atlas
   ↓
Vector Index
   ↓
$vectorSearch
   ↓
Similarity Results
```

The vector index must match the dimensions and similarity configuration expected by the application's embedding service.

---

# ☁️ Deployment

EduBot is deployed using:

```text
GitHub
   ↓
Render
   ↓
Node.js / Express
   ↓
MongoDB Atlas
```

The repository contains:

```text
render.yaml
```

which can be used to configure the Render service.

---

# 🚀 Render Configuration

Recommended configuration:

```text
Runtime:
Node

Build Command:
npm --prefix server ci

Start Command:
npm --prefix server start

Health Check:
 /api/health
```

The application listens on the port provided through:

```env
PORT
```

---

# 🔐 Production Environment Variables

Configure the following in Render:

```text
NODE_ENV
MONGODB_URI
JWT_SECRET
```

Additional AI provider variables should be configured only if the deployed response-generation service requires them.

Do not commit production secrets to GitHub.

---

# 🔄 Deployment Flow

```text
Developer
    ↓
Git commit
    ↓
GitHub main
    ↓
Render detects commit
    ↓
Install dependencies
    ↓
Start Node server
    ↓
Connect MongoDB Atlas
    ↓
Health check
    ↓
Production
```

---

# 🧪 Testing Checklist

Before considering a release complete, test:

## Authentication

- [ ] Register
- [ ] Login
- [ ] Invalid login
- [ ] Missing token
- [ ] Logout

## Student

- [ ] Dashboard loads
- [ ] Subjects load
- [ ] Chat loads
- [ ] Send message
- [ ] Bot response
- [ ] New conversation
- [ ] Conversation history
- [ ] Reload conversation
- [ ] Feedback submission

## Admin

- [ ] Admin login
- [ ] Admin dashboard
- [ ] User management
- [ ] Subject management
- [ ] Knowledge management
- [ ] Feedback management
- [ ] Unauthorized users cannot access admin functionality

## Production

- [ ] Render deployment succeeds
- [ ] `/api/health` returns success
- [ ] MongoDB reports connected
- [ ] Authentication works
- [ ] Chat works
- [ ] Vector retrieval works
- [ ] Feedback works
- [ ] Admin panel works

---

# 🐛 Troubleshooting

## `ENOENT package.json`

If you see:

```text
Could not read package.json
```

make sure you are in the correct directory.

Backend:

```bash
cd server
npm run dev
```

From project root:

```bash
npm --prefix server run dev
```

Do not run:

```bash
npm --prefix server run dev
```

while already inside the `server` directory.

---

## MongoDB connection failed

Check:

```text
MONGODB_URI
```

Then verify MongoDB Atlas:

```text
Network Access
Database Access
Cluster status
```

The deployed Render service must be allowed to connect to the Atlas cluster.

---

## JWT authentication fails

Check:

```text
JWT_SECRET
```

Make sure the same secret is available to the running application.

After changing a production JWT secret, existing tokens will no longer be valid and users may need to log in again.

---

## Chat does not work

Check:

```text
/api/chat
```

Then inspect the Render logs.

Verify:

```text
MongoDB connected
JWT token valid
Knowledge retrieval working
AI/fallback response service working
```

---

## Embedding generation fails

If an external embedding provider is configured, check its API credentials and quota.

EduBot's current embedding architecture uses local Transformers.js embeddings, so OpenAI credits are not required for the local embedding-generation pipeline.

---

# 🔒 Security Recommendations

For production:

- Never commit `.env`
- Use a strong `JWT_SECRET`
- Use a strong MongoDB password
- Use MongoDB least-privilege database users
- Avoid permanently allowing unrestricted MongoDB network access when a narrower configuration is practical
- Keep dependencies updated
- Review `npm audit`
- Keep admin credentials private
- Use HTTPS in production
- Do not expose database credentials in frontend JavaScript

---

# 📈 Future Improvements

Possible future improvements include:

- Streaming AI responses
- More advanced RAG pipelines
- Conversation search
- File/PDF knowledge ingestion
- Document chunking
- Improved semantic ranking
- Multiple embedding models
- More detailed analytics
- Admin activity logs
- Role-based permissions
- Email verification
- Password reset
- OAuth authentication
- Automated testing
- CI/CD with GitHub Actions
- Monitoring and error tracking
- Custom domain
- Production database network hardening

---

# 🎯 Project Goals

EduBot was designed to demonstrate a complete full-stack application containing:

```text
Frontend
   +
REST API
   +
Authentication
   +
MongoDB
   +
NLP
   +
Embeddings
   +
Vector Search
   +
Knowledge Retrieval
   +
Chat
   +
Admin Dashboard
   +
Deployment
```

The project demonstrates how modern web technologies can be combined to create an educational AI application.

---

# 📊 High-Level System Diagram

```text
                         ┌──────────────────┐
                         │     Student      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   EduBot UI      │
                         │ HTML/CSS/JS      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Express REST API │
                         └────────┬─────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
       Authentication        Chat Service       Admin Service
             │                    │                    │
             │                    ▼                    │
             │             Retrieval Service           │
             │                    │                    │
             │                    ▼                    │
             │             Vector Search                │
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  MongoDB Atlas   │
                         │                  │
                         │ Users            │
                         │ Subjects         │
                         │ Knowledge        │
                         │ Conversations    │
                         │ Messages         │
                         │ Feedback         │
                         │ Embeddings       │
                         └──────────────────┘
```

---

# 👨‍💻 Author

**Abhi Kumar**

GitHub:

https://github.com/abhikumar19999999-maker

Project:

https://github.com/abhikumar19999999-maker/edu-chatbot

Live Application:

https://edu-chatbot-8zft.onrender.com

---

# 📄 License

This project can be licensed according to the author's requirements.

If you intend to distribute the project publicly, add an appropriate license file such as:

```text
MIT License
```

or another license appropriate for your intended use.

---

# ⭐ Project Status

```text
Production Deployment: ✅
MongoDB Atlas:          ✅
Authentication:         ✅
Student Dashboard:      ✅
Admin Dashboard:        ✅
Chat System:            ✅
Conversation History:   ✅
Feedback System:        ✅
Knowledge Base:         ✅
Embeddings:             ✅
Vector Search:          ✅
Security Middleware:   ✅
Render Deployment:      ✅
Health Check:           ✅
```

**EduBot is currently deployed and running in production.**
