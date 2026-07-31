# GenZPocket Project Implementation Checklist

This task list represents atomic, sequentially ordered development tasks for GenZPocket based on the Product Requirements Document (PRD), Design System Doc, and Technical Stack.

---

## Phase 1: Database & Core Backend Setup

- [x] Task 1.1: Define database models (User, Expense, Budget, SavingsGoal, RecurringExpense, AIConversation, MonthlyReport, Notification, UserBadge) in SQLAlchemy (`backend/models.py`)
- [x] Task 1.2: Set up async SQLAlchemy engine and session dependency helper (`backend/database.py`)
- [x] Task 1.3: Define core Pydantic request/response schemas for all entities (`backend/schemas.py`)
- [x] Task 1.4: Initialize FastAPI app with CORS middleware and health check endpoint (`backend/main.py`)
- [ ] Task 1.5: Implement Better Auth verification middleware in FastAPI (`backend/auth/dependencies.py`) to parse session tokens/JWTs
- [x] Task 1.6: Implement basic POST endpoint for creating manual expenses in (`backend/routers/expenses.py`)

---

## Phase 2: Core Expense CRUD & Category Management

- [ ] Task 2.1: Add GET `/expenses` endpoint to list user expenses with pagination and filtering
- [ ] Task 2.2: Add PUT `/expenses/{id}` and DELETE `/expenses/{id}` endpoints to modify/delete logged expenses
- [ ] Task 2.3: Implement auto-categorization service (rule-based or simple classifier) on expense creation
- [ ] Task 2.4: Set up receipt uploading to Cloudflare R2 and save URLs to database
- [ ] Task 2.5: Implement OCR endpoint `/expenses/ocr` using Google Vision API to extract amounts, merchants, and dates

---

## Phase 3: Budgeting & Savings Goals

- [ ] Task 3.1: Create Budget endpoints `/budgets` (POST to create/set, GET to retrieve, PUT to update category/overall limits)
- [ ] Task 3.2: Implement `/budgets/status` logic to calculate spending vs. overall and category-specific limits
- [ ] Task 3.3: Implement Savings Goals endpoints `/goals` (POST to create, GET to retrieve, PUT to update/add savings)
- [ ] Task 3.4: Integrate budget notification alerts (50%, 80%, 100% threshold checks) on every expense log

---

## Phase 4: Recurring Expenses & Background Jobs

- [ ] Task 4.1: Set up Redis and Celery background workers for task queues
- [ ] Task 4.2: Implement endpoints `/recurring` for setting up, updating, and cancelling recurring subscriptions
- [ ] Task 4.3: Write Celery task to check and auto-apply recurring expenses when their next due date is reached
- [ ] Task 4.4: Write Celery task for weekly notifications and budget summary alerts

---

## Phase 5: AI Adviser & Insights

- [ ] Task 5.1: Implement AI Conversation endpoint `/ai/chat` utilizing OpenAI API for interactive financial Q&A
- [ ] Task 5.2: Create prompt templates for the AI adviser enforcing a friendly, non-judgmental, Gen-Z casual tone
- [ ] Task 5.3: Build "what-if" affordability utility check (e.g. balance and budget check for "Can I afford X?")
- [ ] Task 5.4: Implement a service to detect anomalies (unusual subscriptions, spikes in category spending) and generate insights

---

## Phase 6: Monthly Reports & Analytics

- [ ] Task 6.1: Implement logic to calculate monthly financial health scores based on savings and budget adherence
- [ ] Task 6.2: Build `/reports` endpoint to fetch monthly summaries and PDF export URLs
- [ ] Task 6.3: Implement PDF generator service to generate beautiful brutalist ledger-style monthly statements
- [ ] Task 6.4: Write monthly scheduler task in Celery to compile, generate, and store reports in Cloudflare R2

---

## Phase 7: Gamification & Engagement

- [ ] Task 7.1: Implement streaks calculation logic (updating streak on sequential active days)
- [ ] Task 7.2: Create badge definition system and check/award badges on milestone achievements
- [ ] Task 7.3: Implement notification preferences endpoint `/notifications` (read/unread states and config)

---

## Phase 8: Frontend Foundations & Styling

- [ ] Task 8.1: Install/update CSS system in `app/globals.css` with Space Grotesk / Inter / Mono fonts, borders, and Neo-Brutalist variables
- [ ] Task 8.2: Implement Better Auth client routes (`/login`, `/signup`) with neo-brutalist card structures
- [ ] Task 8.3: Build main layout shell containing Navigation Sidebar/Navbar with thick borders and custom hover states
- [ ] Task 8.4: Create reusable Neo-Brutalist components: Buttons (with offset physical-press states), Input Boxes, and Outlined Cards

---

## Phase 9: Dashboard & Transactions UI

- [ ] Task 9.1: Build Home Dashboard displaying the "Stamped Ledger Card" (Remaining budget, days left vs money left indicator)
- [ ] Task 9.2: Create expense Quick-Add bottom sheet / modal featuring <3 tap category chips
- [ ] Task 9.3: Build list view of recent transactions using Space Mono for currency numbers and clean category icons
- [ ] Task 9.4: Add OCR receipt upload interface with a stylized camera frame placeholder

---

## Phase 10: Budget, Savings, & Analytics UI

- [ ] Task 10.1: Build Analytics screen utilizing Recharts with flat-color bars, mono labels, and a category donut chart
- [ ] Task 10.2: Build Budget planner UI displaying progress bars as thick outlined blocks filling with flat colors
- [ ] Task 10.3: Build Savings Goal tracking UI with milestone gauges and gamified status stamps

---

## Phase 11: AI Chat & Reports UI

- [ ] Task 11.1: Build AI Adviser Chat screen (dark mode terminal-inspired zone, lilac response boxes with offset shadows)
- [ ] Task 11.2: Build Monthly Reports view (stamped health score, tabular summaries, and CSV/PDF download buttons)
- [ ] Task 11.3: Build Settings & Profile screen showing earned badges and streak counters
