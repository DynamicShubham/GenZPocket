
---

# 🏆 Recommended Tech Stack (2026)

| Layer               | Technology                                   | Why?                                                                                       |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Frontend**        | Next.js 16 (React + TypeScript)              | Best React framework for web apps, SEO, App Router, Server Components, excellent ecosystem |
| **UI**              | Tailwind CSS v4 + shadcn/ui                  | Modern, accessible, customizable, beautiful UI with minimal effort                         |
| **Backend**         | FastAPI                                      | High-performance Python API framework, ideal for AI integrations and async workloads       |
| **Authentication**  | Better Auth                                  | Open-source, modern authentication with OAuth, OTP, sessions, and full control             |
| **Database**        | Neon PostgreSQL                              | Serverless PostgreSQL with autoscaling, branching, and generous free tier                  |
| **ORM**             | SQLAlchemy 2.0 + Alembic                     | Mature Python ORM with robust migrations                                                   |
| **Caching**         | Redis                                        | Fast caching, rate limiting, and session storage                                           |
| **Background Jobs** | Celery + Redis                               | Handles scheduled reports, AI summaries, recurring expenses, and notifications             |
| **Storage**         | Cloudflare R2                                | Cost-effective S3-compatible object storage for receipts and reports                       |
| **AI**              | OpenAI GPT-5.5                               | Conversational financial assistant, affordability analysis, spending insights              |
| **OCR**             | Google Document AI / Vision API              | Reliable receipt scanning and data extraction                                              |
| **Charts**          | Recharts                                     | Clean, responsive charts for dashboards                                                    |
| **Deployment**      | Vercel (Frontend) + Railway (Backend) + Neon | Simple deployment with independent scaling                                                 |
| **Monitoring**      | Sentry                                       | Error tracking and performance monitoring                                                  |
| **Analytics**       | PostHog                                      | User analytics, funnels, and feature adoption tracking                                     |

---

# 1️⃣ Frontend — Next.js 16 + TypeScript

### Why Next.js?

Although your PRD started as mobile-first, you've decided to build a **web application**. For that, Next.js is the strongest choice.

### Advantages

* Server Components
* Excellent routing
* Fast page loading
* API integration
* Easy deployment
* Great TypeScript support
* Future mobile compatibility through shared React knowledge

---

### UI Stack

* Tailwind CSS v4
* shadcn/ui
* Lucide Icons
* Framer Motion

This combination gives you a modern Gen-Z-friendly interface that aligns well with your product vision. 

---

# 2️⃣ Backend — FastAPI

## Why FastAPI?

Your application isn't just CRUD.

It includes:

* AI Chat
* Budget Calculations
* Financial Reports
* OCR
* Background Processing
* Analytics
* Future ML Features

Python excels at all of these.

### Advantages

✅ Extremely fast

✅ Async support

✅ Automatic OpenAPI documentation

✅ Easy AI integration

✅ Excellent developer experience

Unlike Django, FastAPI remains lightweight while scaling well for API-first applications.

---

# 3️⃣ Authentication — Better Auth

## Why Better Auth?

Your PRD specifies secure authentication with OTP/social login. 

Better Auth provides:

* Google Login
* GitHub Login
* Email Authentication
* OTP
* Session Management
* Passkeys
* Multi-factor Authentication

### Why not Clerk?

Although Clerk is excellent,

Better Auth gives

* No vendor lock-in
* Open source
* Greater customization
* Lower long-term cost

which is ideal for an independent SaaS.

> **Important:** Better Auth is built around the JavaScript ecosystem. With a Python backend, the cleanest architecture is to let Better Auth handle authentication on the frontend (Next.js) and have FastAPI verify the issued tokens. This separation works well in production.

---

# 4️⃣ Database — Neon PostgreSQL

## Why Neon?

Perfect for SaaS.

Advantages

* Serverless PostgreSQL
* Autoscaling
* Database branching
* Instant restores
* Excellent free tier
* Easy Railway integration

Expense tracking data is highly relational, making PostgreSQL the right choice.

---

# 5️⃣ ORM — SQLAlchemy 2.0 + Alembic

Why?

* Industry standard
* Excellent relationship handling
* Reliable migrations
* Full control over queries
* Strong typing

Your core entities—Users, Expenses, Budgets, Goals, Reports, AI Conversations—fit naturally into a relational schema.

---

# 6️⃣ AI Layer

Use **OpenAI GPT-5.5**.

It powers:

* Financial Advisor
* Budget Suggestions
* Spending Insights
* Weekly Check-ins
* Affordability Questions
* Spending Anomaly Detection

Keep calculations such as totals, remaining budget, and financial scores in Python services; reserve the LLM for explanations and recommendations.

---

# 7️⃣ Background Jobs

Use **Celery + Redis**.

Required for:

* Monthly Report Generation
* Weekly AI Summaries
* Budget Alerts
* Savings Notifications
* Scheduled Emails
* Recurring Expense Processing

---

# 8️⃣ Redis

Redis should handle:

* Rate Limiting
* API Cache
* AI Response Cache
* Celery Queue
* Temporary Sessions

This reduces database load and improves responsiveness.

---

# 9️⃣ Storage

Cloudflare R2

Store:

* Receipt Images
* PDF Reports
* Exported CSV Files
* User Avatars

Benefits:

* S3 Compatible
* No egress fees
* Global CDN

---

# 🔟 OCR

Use **Google Document AI** (or Google Vision API if Document AI is unnecessary for MVP).

It provides reliable extraction from:

* Receipts
* Bills
* Invoices

matching the receipt-scanning feature in your PRD. 

---

# 1️⃣1️⃣ Deployment

## Frontend

**Vercel**

Why?

* Native Next.js support
* Automatic deployments
* Preview environments
* Edge optimization

---

## Backend

**Railway**

Why?

* Excellent FastAPI support
* Simple Docker deployments
* Easy Redis integration
* Good developer experience

---

## Database

**Neon PostgreSQL**

---

# 1️⃣2️⃣ Monitoring

Use **Sentry** for:

* API errors
* Frontend crashes
* Performance monitoring

---

# 1️⃣3️⃣ Analytics

Use **PostHog** to measure the KPIs defined in your PRD:

* DAU / MAU
* Budget adoption
* AI usage
* Retention
* Funnel analysis
* Feature engagement 

---

# 🏗 Architecture

```text
                 Next.js 16 (TypeScript)

            Tailwind CSS + shadcn/ui

                       │
                       │
                 Better Auth
          (Authentication Service)
                       │
                JWT / Session Tokens
                       │
                       ▼
                FastAPI (Python)
                       │
      ┌────────────────┼────────────────┐
      │                │                │
 SQLAlchemy       Celery Workers     Redis
      │                │                │
      └────────────────┼────────────────┘
                       │
               Neon PostgreSQL
                       │
      ┌────────────────┼────────────────┐
      │                │                │
 OpenAI GPT-5.5   Google OCR    Cloudflare R2
```

---

# 📦 Final Tech Stack

| Category               | Technology                      | Justification                                                                                  |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| 🎨 Frontend            | **Next.js 16 + TypeScript**     | Best framework for modern web applications with excellent performance and developer experience |
| 🎭 UI                  | **Tailwind CSS v4 + shadcn/ui** | Accessible, responsive, and highly customizable components                                     |
| 🐍 Backend             | **FastAPI**                     | High-performance Python framework, ideal for AI-heavy applications                             |
| 🔐 Authentication      | **Better Auth**                 | Open-source authentication with OAuth, OTP, passkeys, and full ownership                       |
| 🗄 Database            | **Neon PostgreSQL**             | Serverless relational database with autoscaling and branching                                  |
| 🧩 ORM                 | **SQLAlchemy 2.0 + Alembic**    | Mature Python ORM with reliable schema migrations                                              |
| ⚡ Cache                | **Redis**                       | High-speed caching, queues, and rate limiting                                                  |
| 🤖 AI                  | **OpenAI GPT-5.5**              | Natural-language financial guidance and personalized insights                                  |
| 📄 OCR                 | **Google Document AI**          | Accurate receipt and invoice parsing                                                           |
| 📂 Storage             | **Cloudflare R2**               | Low-cost object storage with no egress fees                                                    |
| 📈 Charts              | **Recharts**                    | Interactive analytics dashboards                                                               |
| 📬 Background Jobs     | **Celery + Redis**              | Scheduled reports, notifications, and recurring processing                                     |
| 🚀 Frontend Deployment | **Vercel**                      | Optimized hosting for Next.js                                                                  |
| 🚀 Backend Deployment  | **Railway (Docker)**            | Simple, scalable FastAPI deployment                                                            |
| 📊 Analytics           | **PostHog**                     | Product analytics and KPI tracking                                                             |
| 🔍 Monitoring          | **Sentry**                      | Error tracking and performance monitoring                                                      |
