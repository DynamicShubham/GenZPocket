# Product Requirements Document (PRD)
## GenZPocket — Smart Expense Tracker for College Students

**Version:** 1.0
**Date:** July 10, 2026
**Document Owner:** Product Team
**Status:** Draft for Review

---

## 1. Executive Summary

GenZPocket is a mobile-first expense tracking application designed specifically for college students, who face unique financial challenges: irregular income (allowances, part-time jobs, scholarships), tight budgets, peer-driven spending pressure, and little to no formal financial education. GenZPocket combines smart, low-friction expense logging, visual analytics, proactive budget alerts, an AI-powered financial adviser, and automated monthly reporting to help students build healthy money habits without the complexity of traditional finance apps built for working professionals.

---

## 2. Problem Statement

College students typically:
- Live on irregular, limited income (parental allowance, part-time work, scholarships, loans).
- Lack financial literacy and structured budgeting habits.
- Use multiple informal tracking methods (notes apps, memory, spreadsheets) that are abandoned quickly.
- Are highly social-spending driven (food delivery, outings, subscriptions) leading to overspending.
- Find existing finance apps (e.g., built for salaried professionals with EMIs, investments, taxes) overly complex and irrelevant to their needs.

**Opportunity:** Build a lightweight, visually engaging, gamified, and intelligent expense tracker tailored to the student lifestyle and spending patterns.

---

## 3. Goals & Objectives

### 3.1 Business Goals
- Achieve high daily/weekly engagement among college-age users (18–24).
- Build a defensible, sticky product through habit formation (streaks, alerts, insights).
- Establish a foundation for future monetization (premium AI adviser tier, partnerships with student banking/fintech products).

### 3.2 Product Goals
| Goal | Description |
|---|---|
| G1 | Make expense logging effortless (under 10 seconds per entry) |
| G2 | Provide instant visual clarity on spending patterns |
| G3 | Prevent overspending through proactive, timely alerts |
| G4 | Deliver personalized, actionable financial guidance via AI |
| G5 | Help students reflect and improve via periodic reports |

### 3.3 Non-Goals (Out of Scope for V1)
- Investment tracking or portfolio management
- Tax filing or tax optimization
- Direct bank account linking/aggregation (V1 will support manual entry + optional SMS/email parsing as a fast-follow)
- Peer-to-peer payments or bill splitting (potential future feature)

---

## 4. Target Users & Personas

### Persona 1: "Budget-Conscious Riya" (19, Undergraduate, Hostel Resident)
- Receives a fixed monthly allowance from parents.
- Anxious about running out of money before month-end.
- Wants simple visual proof of where money goes.

### Persona 2: "Freelancer Arjun" (21, Part-time Earner)
- Irregular income from gig work/tutoring.
- Needs to track variable income vs. expenses.
- Wants smart nudges rather than manual budgeting effort.

### Persona 3: "Social Spender Meera" (20, Day Scholar)
- Frequent spender on food delivery, outings, shopping.
- Impulsive spending habits; needs behavior-based alerts.
- Wants friendly, non-judgmental guidance (not a "finance bro" tone).

---

## 5. User Stories

### 5.1 Smart Expense Management
- As a student, I want to add an expense in under 10 seconds so that I don't skip logging it.
- As a student, I want the app to auto-categorize my expenses (food, travel, subscriptions, etc.) so I don't have to tag everything manually.
- As a student, I want to scan a receipt or paste an SMS/UPI notification so expenses are logged automatically.
- As a student, I want to log recurring expenses (subscriptions, rent, mess fees) once and have them auto-track monthly.
- As a student, I want to split a group expense (e.g., dinner with friends) so I can track only my share.
- As a student, I want to edit or delete a wrongly logged expense easily.

### 5.2 Visual Analytics Dashboard
- As a student, I want to see a pie/bar chart of my spending by category so I understand my habits at a glance.
- As a student, I want to compare this month's spending to last month's so I can see if I'm improving.
- As a student, I want to see a daily/weekly spending trend line so I can spot spikes.
- As a student, I want a "top 5 expenses" widget so I know what's draining my budget.
- As a student, I want a home-screen widget showing my remaining budget at a glance.

### 5.3 Budget Planning & Alerts
- As a student, I want to set a monthly budget overall and per category (food, entertainment, travel, etc.).
- As a student, I want to receive a notification when I've used 50%, 80%, and 100% of a category budget.
- As a student, I want a "days left vs. money left" indicator so I can pace my spending.
- As a student, I want to set savings goals (e.g., "save ₹2000 for a trip") and track progress.
- As a student, I want smart budget suggestions based on my past spending, not arbitrary defaults.

### 5.4 AI Adviser
- As a student, I want to ask natural-language questions like "Can I afford to eat out this weekend?" and get a clear answer.
- As a student, I want personalized tips like "You're spending 30% more on food delivery than last month—here's how to cut back."
- As a student, I want the AI to flag unusual spending patterns (e.g., "You spent ₹1500 on subscriptions you haven't used in 2 months").
- As a student, I want proactive weekly check-ins from the AI adviser summarizing my week and suggesting one actionable change.
- As a student, I want the AI's tone to be friendly and non-judgmental, not preachy.

### 5.5 Monthly Reports & Exports
- As a student, I want an automated end-of-month report summarizing income, expenses, savings, and budget adherence.
- As a student, I want to export my expense data as PDF/CSV/Excel for personal records or sharing with parents.
- As a student, I want a "financial health score" each month to track improvement over time.
- As a student, I want to compare my spending across the last 3–6 months in the report.

---

## 6. Feature List (Detailed)

### 6.1 Smart Expense Management
- Quick-add expense (amount, category, note) with < 3 taps
- Auto-categorization using ML/rules engine, editable by user
- Receipt scanning (OCR) for auto-fill
- SMS/email/UPI notification parsing (opt-in, privacy-first) to auto-suggest entries
- Recurring expense templates (rent, subscriptions, mess fees)
- Group expense splitting with friends
- Multi-currency support (for exchange/international students)
- Offline mode with sync

### 6.2 Visual Analytics Dashboard
- Category-wise pie/donut chart
- Monthly/weekly/daily trend line graphs
- Month-over-month comparison view
- Top spending categories & merchants
- Customizable dashboard widgets
- Home-screen widget (iOS/Android) for quick balance view
- Dark mode with Gen-Z-friendly, colorful UI themes

### 6.3 Budget Planning & Alerts
- Overall + category-wise monthly budget setting
- Real-time budget consumption tracker (progress bars)
- Push notification alerts at customizable thresholds (50/80/100%)
- "Safe-to-spend today" daily allowance calculator
- Savings goal creation and tracking
- Auto-suggested budgets based on historical spending and peer benchmarks (anonymized, opt-in)

### 6.4 AI Adviser
- Conversational chat interface (natural language Q&A)
- Personalized insights and anomaly detection
- Weekly/bi-weekly proactive check-ins
- "What-if" affordability queries (e.g., "Can I afford X?")
- Behavioral nudges (e.g., subscription cleanup suggestions)
- Tone customization (friendly/casual vs. straightforward)

### 6.5 Monthly Reports & Exports
- Auto-generated monthly summary report (in-app + email)
- Financial health score with trend history
- PDF/CSV/Excel export
- Shareable report snapshot (e.g., to share with parents/guardians)
- Year-in-review annual summary

### 6.6 Supporting/Platform Features
- Onboarding flow with quick budget setup wizard
- Gamification: streaks, badges for consistent logging and budget adherence
- Secure authentication (OTP/social login) & data encryption
- Privacy controls for shared/parsed data sources
- Push notification preference center

---

## 7. Success Metrics (KPIs)

### 7.1 Engagement Metrics
| Metric | Target (6 months post-launch) |
|---|---|
| Daily Active Users (DAU) / Monthly Active Users (MAU) ratio | ≥ 25% |
| Average expenses logged per user per week | ≥ 10 |
| 30-day retention rate | ≥ 35% |
| 90-day retention rate | ≥ 20% |

### 7.2 Feature Adoption Metrics
| Metric | Target |
|---|---|
| % users who set at least one budget | ≥ 60% |
| % users who interact with AI adviser monthly | ≥ 40% |
| % users who view analytics dashboard weekly | ≥ 50% |
| % users who export/view monthly report | ≥ 30% |

### 7.3 Outcome Metrics
| Metric | Target |
|---|---|
| % users staying within budget by month 3 | ≥ 45% (up from baseline) |
| Reduction in average overspending incidents | 20% decrease over 3 months |
| Average "financial health score" improvement | +10 points over 3 months |
| User-reported confidence in money management (survey) | ≥ 4/5 average rating |

### 7.4 Business Metrics
| Metric | Target |
|---|---|
| App store rating | ≥ 4.4 |
| Organic install share (referrals/word-of-mouth) | ≥ 30% |
| Premium conversion rate (if freemium AI tier launched) | ≥ 5% |

---

## 8. Assumptions & Risks

**Assumptions:**
- Target users primarily use smartphones (Android-first market emphasis).
- Students are willing to opt in to SMS/notification parsing for auto-tracking.
- AI adviser costs (LLM API usage) are sustainable at scale via tiered access.

**Risks:**
- **Privacy concerns**: Parsing SMS/UPI notifications requires strong, transparent privacy controls to build trust.
- **Habit drop-off**: Expense-logging apps commonly see steep usage decline after week 2–3; gamification and low-friction logging are critical mitigations.
- **AI accuracy**: Poor categorization or irrelevant AI advice could erode trust quickly; requires strong feedback loops and continuous model tuning.
- **Monetization tension**: Balancing free vs. premium features without alienating a price-sensitive student user base.

---

## 9. Suggested Roadmap (Phased)

| Phase | Focus | Key Features |
|---|---|---|
| Phase 1 (MVP) | Core tracking + budgeting | Smart expense management, basic dashboard, budget alerts |
| Phase 2 | Intelligence layer | AI adviser (basic Q&A + insights), advanced analytics |
| Phase 3 | Reporting & retention | Monthly reports/exports, gamification, savings goals |
| Phase 4 | Growth & monetization | Premium AI tier, social/referral features, bank integrations |

---

## 10. Open Questions
- Will GenZPocket support direct bank/UPI account linking in V1, or manual/SMS-parsing only?
- What is the primary monetization model — freemium AI adviser, ads, or a paid pro tier?
- Should group expense-splitting evolve into a full peer payment feature?
- What level of parental/guardian visibility (if any) should be supported, given the target demographic?

---

*End of Document*
