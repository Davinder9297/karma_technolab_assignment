# Dynamic Budget Allocation & Ledger Audit System

A full-stack application designed to manage personal or business finances using a "Bucket" system with automated income allocation and a verifiable ledger audit trail.

## 🚀 Key Features

- **Dynamic Income Allocation**: Automatically split income into predefined buckets based on percentage or fixed-amount rules.
- **Append-Only Ledger**: Every financial event (allocation, expense, reversal) is recorded as an immutable entry for full auditability.
- **Paise Precision**: All monetary values are handled as integers (paise) to prevent floating-point rounding errors (₹1.00 = 100 paise).
- **Reconciliation Engine**: Verify data integrity by comparing precomputed bucket balances against the raw ledger history.
- **Modern Dashboard**: Real-time visualization of bucket health and monthly spending trends.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose.
- **Database**: MongoDB (Local or Atlas).
- **Validation**: Zod (Schema validation for API requests).

---

## 📋 Prerequisites

- **Node.js**: v18 or higher.
- **MongoDB**: A running instance with **Replica Set** support. 
  - **IMPORTANT**: This system uses MongoDB Transactions for financial integrity. Transactions require a Replica Set (even for a single node).
  - If using a local standalone MongoDB, you must convert it to a single-node replica set. 
  - Alternatively, use **MongoDB Atlas** (which has replica sets enabled by default).

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd budget-allocation-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
MONGODB_URI=mongodb://localhost:27017/budget_system
DEMO_USER_ID=64f1a2b3c4d5e6f7a8b9c0d1
PORT=5000
```

### 3. Initialize Data (Seeding)
This script creates the demo user, default buckets (Rent, Food, etc.), and initial allocation rules.
```bash
npm run seed
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```
The frontend is configured to connect to `http://localhost:5000/api` by default.

---

## 🏃 Running the Application

### Start Backend
```bash
cd backend
npm run dev
```

### Start Frontend
```bash
cd frontend
npm run dev -- --port 3002
```
Access the application at: **[http://localhost:3002](http://localhost:3002)**

---

## ## SECTION 1 — PROJECT OVERVIEW

The Dynamic Budget Allocation & Ledger Audit System is a comprehensive financial management tool designed to automate the distribution of income into various spending "buckets." It ensures financial discipline by enforcing allocation rules and providing a transparent audit trail for every transaction. The system is built to handle complex real-world scenarios like rule changes over time, overspending, and data integrity verification.

### Key Capabilities
- **Income Allocation**: Automatically splits incoming funds based on complex rules (Fixed + Percentage).
- **Rule Versioning**: Maintains a historical timeline of allocation rules, ensuring past incomes are split according to the rules active at that time.
- **Immutable Ledger**: Every financial event is recorded as an append-only entry, making the system's history tamper-proof and verifiable.
- **Reconciliation**: A self-healing engine that detects balance mismatches and can rebuild the state from the ledger.

### Tech Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod (Type-safe schema validation)

### Money Storage Approach
To avoid the notorious precision issues associated with floating-point math (e.g., `0.1 + 0.2 !== 0.3`), all monetary values are stored as **integer paise**.
- **1 INR = 100 paise**.
- Calculation: All internal logic uses integers.
- Conversion: Values are divided by 100 only at the final display layer in the UI.

---

## SECTION 2 — SYSTEM ARCHITECTURE

The system follows a linear flow for data processing while maintaining a cached state for performance.

```text
Income → Allocation Rules → Buckets → Ledger 
                                     ↓ 
                           Bucket Balances (precomputed) 
                                     ↓ 
                             Reconciliation 
```

### Architectural Layers

1.  **Controllers Layer**
    - Entry point for all HTTP requests.
    - Uses Zod schemas to validate request bodies before they reach business logic.
    - Formats API responses and handles HTTP-level errors.

2.  **Services Layer**
    - The core brain of the application.
    - `incomeService`: Manages the complex multi-bucket allocation logic.
    - `expenseService`: Orchestrates expense creation, updates (audit-trail optimized), and soft deletions.
    - `allocationService`: Specialized logic for finding active rules and performing integer-safe splits.
    - `balanceService`: Atomic updates to precomputed balances and monthly summaries.
    - `reconciliationService`: Implements the comparison and rebuilding logic for data integrity.

3.  **Repository Layer**
    - Isolates all database-specific queries (Mongoose calls).
    - Ensures that business logic remains independent of the database structure.
    - One repository file per MongoDB collection.

4.  **Models Layer**
    - Defines the structure of the data using Mongoose schemas.
    - Includes TypeScript interfaces for end-to-end type safety.
    - Defines database indexes for performance (e.g., unique index on `userId` + `bucketId`).

5.  **Database Layer**
    - MongoDB instance with 10 specialized collections.
    - **Transactions**: All operations touching multiple collections (like adding income) use MongoDB sessions/transactions to guarantee atomicity.
    - **Ledger**: Designed as an append-only store for absolute auditability.

---

## SECTION 3 — FOLDER STRUCTURE

```text
/backend
  /src
    /config         # Database connection and environment setup
    /controllers    # HTTP request handlers (Zod validation happens here)
    /models         # Mongoose schemas and TypeScript interfaces
    /repositories   # Data access layer (MongoDB queries)
    /services       # Business logic (allocation, reconciliation, etc.)
    /validators     # Zod schema definitions for API inputs
    /scripts        # Seeding, clearing, and testing utilities
    /utils          # Helper functions and constants
/frontend
  /src
    /app            # Next.js App Router (pages and layouts)
    /components     # Reusable UI components (Buckets, Income, Dashboard)
    /hooks          # Custom React hooks for API interaction
    /services       # Frontend API client wrappers
    /types          # Frontend-specific TypeScript definitions
```

---

## SECTION 4 — DATABASE DESIGN

The system utilizes 10 collections to maintain state and history.

| Collection | Purpose | Key Fields | Indexes |
| :--- | :--- | :--- | :--- |
| `users` | User profiles | `email`, `name` | `email_1` |
| `income_types` | Categories like Salary, Bonus | `name`, `userId` | `userId_1_name_1` |
| `buckets` | Spending categories (Rent, Food) | `name`, `isActive` | `userId_1_isActive_1` |
| `allocation_rules` | Rules for splitting income | `incomeTypeId`, `version`, `rules[]` | `incomeTypeId_1_version_1` |
| `incomes` | Recorded income events | `amount`, `date`, `allocations[]` | `userId_1_date_1` |
| `expenses` | Recorded spending events | `amount`, `bucketId`, `status` | `bucketId_1_status_1` |
| `ledger_entries` | **Immutable** transaction log | `bucketId`, `amount`, `entryType` | `bucketId_1_createdAt_1` |
| `bucket_balances` | **Precomputed cache** of balances | `currentBalance`, `totalCredits` | `userId_1_bucketId_1` (Unique) |
| `monthly_bucket_summaries` | Performance-optimized totals | `month`, `year`, `credits`, `debits` | `bucketId_1_year_1_month_1` |
| `reconciliation_runs` | Audit history of integrity checks | `status`, `mismatchedBuckets[]` | `userId_1_createdAt_1` |

### Design Decisions
- **Basis Points**: Percentages are stored as integers (10% = 10,000 basis points). This allows for pure integer math: `Math.floor(amount * basisPoints / 100000)`.
- **Append-Only Ledger**: Entries are never edited or deleted. Corrections are made via `REVERSAL` or `ADJUSTMENT` entries, ensuring a permanent paper trail.
- **Precomputed Cache**: `bucket_balances` exists so that the dashboard can load instantly without summing millions of ledger rows on every refresh.

---

## SECTION 5 — KEY FLOWS EXPLAINED

### FLOW 1 — Income Allocation
1.  **Validate**: Zod checks the request body (amount, type, date).
2.  **Lookup**: Finds the rule version active on the **income date** (historical lookup).
3.  **Prioritize**: Separates `FIXED` rules from `PERCENTAGE` rules.
4.  **Fixed Split**: Deducts fixed amounts first from the total.
5.  **Percentage Split**: Distributes the *remaining* amount using basis points math.
6.  **Remainder**: Calculates unallocated funds if the rule sum is < 100%.
7.  **Transaction**:
    - Saves the `Income` document.
    - Creates `CREDIT` ledger entries for every allocation.
    - Updates `bucket_balances` (increment credits and current balance).
    - Updates `monthly_bucket_summaries` for the specific month.
8.  **Response**: Returns the final breakdown including unallocated amounts.

### FLOW 2 — Expense Deletion
1.  Fetch the original expense and ensure it is currently `ACTIVE`.
2.  Inside a transaction:
    - Mark the expense status as `DELETED`.
    - Create a `CREDIT REVERSAL` ledger entry for the full amount.
    - **Decrement** `totalDebits` on the bucket balance (restoring the state as if the expense never happened).
    - Update the monthly summary (decrement debits).

### FLOW 3 — Expense Update
- **If only description/date changed**: Simple `findByIdAndUpdate` on the expense document. No ledger impact.
- **If amount changed**:
    - Create a `REVERSAL` entry for the old amount.
    - Create an `ADJUSTMENT` entry for the new amount.
    - Update bucket balances based on the net difference.
    - All wrapped in a single transaction.

### FLOW 4 — Rule Versioning
1.  Validate that no other version has the same `effectiveFrom` date.
2.  Find the currently active rule.
3.  Transaction:
    - Set the old rule to `isActive = false` and `effectiveTo = newRule.effectiveFrom`.
    - Create the new rule with `version = currentVersion + 1` and `isActive = true`.
4.  Ensures a continuous, non-overlapping timeline for allocations.

### FLOW 5 — Reconciliation Check
1.  For each bucket, the system calculates `expectedBalance`: `Sum(CREDIT Entries) - Sum(DEBIT Entries)`.
2.  It compares this against the `storedBalance` in the `bucket_balances` collection.
3.  `status = difference === 0 ? MATCHED : MISMATCHED`.
4.  A report is saved to `reconciliation_runs`.

### FLOW 6 — Reconciliation Rebuild
1.  Scans the **entire** ledger history for a user's buckets.
2.  Recomputes `totalCredits`, `totalDebits`, and `currentBalance` from scratch.
3.  Atomically overwrites the `bucket_balances` cache.
4.  Triggers a final reconciliation run to verify the fix.

---

## SECTION 6 — EDGE CASES AND HOW THEY ARE HANDLED

### 1. Rule percentage total less than 100%
- **Decision**: Allow it to support users who don't track all spending.
- **Implementation**: The remaining portion is calculated and stored in the `Income` document with `bucketId: null` and a note "unallocated". No ledger entries are created for this portion.

### 2. Rule percentage total greater than 100%
- **Decision**: Reject at source.
- **Implementation**: Validation prevents saving any rule where the sum of basis points > 100,000. Returns a 400 error.

### 3. Fixed allocation exceeding income amount
- **Decision**: Reject income submission.
- **Implementation**: The system sums all `FIXED` rule values. If the sum > income amount, it returns an error naming the bucket that couldn't be funded.

### 4. Rounding difference in percentage allocation
- **Decision**: Add rounding remainder (1-2 paise) to the highest percentage bucket.
- **Implementation**: After `Math.floor` splits, any leftover paise are distributed to buckets starting from the one with the largest allocation.

### 5. Income amount edited after expenses are made
- **Decision**: Block amount edits.
- **Implementation**: The system only allows updating the description/date of an income. Changing the amount requires a full delete and re-add to maintain consistency.

### 6. Expense updated or deleted
- **Decision**: Never mutate ledger entries.
- **Implementation**: Deletions use `REVERSAL` entries. Amount updates use `REVERSAL` + `ADJUSTMENT` entries to show the full audit trail of the correction.

### 7. Bucket deleted with remaining balance
- **Decision**: Soft delete only.
- **Implementation**: `isActive: false` is used. The bucket remains in the DB and ledger history, but is hidden from new allocation rules or active spending lists.

### 8. Duplicate income submission
- **Decision**: Block by default, allow with `force` flag.
- **Implementation**: Detected by matching `userId`, `type`, `amount`, `date`, and `description`. Returns a 409 conflict on the first attempt.

### 9. Overspending from a bucket
- **Decision**: Allow it.
- **Implementation**: Balances can go negative. The system tracks `overspentAmount` for UI warnings, but never blocks a transaction.

### 10. Reconciliation mismatch
- **Decision**: Show difference and allow rebuilding.
- **Implementation**: The system provides a clear "MISMATCHED" status and a one-click "Rebuild" to restore the cache from the ledger source of truth.

### 11. No allocation rule for income type
- **Decision**: Block income submission.
- **Implementation**: If no rule is active for the specific `income.date`, the submission is rejected with a 400 error.

### Hidden Edge Cases
- **A. Deleted bucket in active rule**: Income submission is blocked if a rule references a bucket that has since been soft-deleted.
- **B. Past-date historical lookup**: Adding income for "last month" correctly uses the rules that were active "last month," not the current ones.
- **C. Duplicate effectiveFrom**: Prevents creating two rules starting on the same day for the same income type.

---

## SECTION 7 — API REFERENCE

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/buckets` | List all active buckets with balances |
| `POST` | `/api/buckets` | Create a new bucket |
| `PATCH` | `/api/buckets/:id` | Update bucket (description, isActive) |
| `GET` | `/api/income-types` | List all income types |
| `POST` | `/api/income-types` | Create a new income type |
| `GET` | `/api/allocation-rules/:typeId` | Get version history for a rule |
| `POST` | `/api/allocation-rules` | Create a new rule version |
| `GET` | `/api/incomes` | List income history (paginated) |
| `POST` | `/api/incomes` | Add new income (triggers allocation) |
| `DELETE` | `/api/incomes/:id` | Reverse an income allocation |
| `GET` | `/api/expenses` | List expense history |
| `POST` | `/api/expenses` | Record a new expense |
| `PATCH` | `/api/expenses/:id` | Update expense (amount/desc) |
| `DELETE` | `/api/expenses/:id` | Reverse an expense |
| `GET` | `/api/ledger` | View raw immutable audit trail |
| `POST` | `/api/reconciliation/run` | Trigger an integrity check |
| `POST` | `/api/reconciliation/rebuild`| Restore balances from ledger |

---

## SECTION 8 — BALANCE ACCOUNTING RULES

The system updates `bucket_balances` using specific mathematical rules for each entry type to keep the cache accurate.

| Entry Type | `totalCredits` | `totalDebits` | `currentBalance` |
| :--- | :--- | :--- | :--- |
| **ALLOCATION** | +amount | — | +amount |
| **EXPENSE** | — | +amount | -amount |
| **REVERSAL (CREDIT)**| — | -amount | +amount |
| **REVERSAL (DEBIT)** | -amount | — | -amount |
| **ADJUSTMENT(CREDIT)**| — | -amount | +amount |
| **ADJUSTMENT(DEBIT)** | — | +amount | -amount |

### Why decrement totalDebits?
When an expense is reversed, we **decrement** `totalDebits` instead of incrementing `totalCredits`. This is because a reversal "undoes" a spending event. By decrementing the debit counter, the `totalCredits` and `totalDebits` fields remain true representations of actual income and actual spending, respectively.

---

## SECTION 9 — DESIGN DECISIONS

1.  **Paise over Rupees**: Floating-point math is unsuitable for finance. Integer paise ensures that every 1/3 split is handled precisely with a 1-paise remainder logic rather than an infinite decimal.
2.  **Basis Points**: Storing 10% as 10,000 allows us to perform all percentage calculations using integer division, further protecting against precision loss.
3.  **Immutable Ledger**: By treating the ledger as the only "Source of Truth," we ensure that the system can always recover from accidental data corruption or bugs in the caching layer.
4.  **Precomputed Balances**: Necessary for O(1) dashboard performance. We trade slightly slower writes (due to extra updates) for lightning-fast reads.
5.  **MongoDB Transactions**: Critical for maintaining consistency across `incomes`, `ledger_entries`, `bucket_balances`, and `monthly_bucket_summaries`.
6.  **Soft Deletion**: Preserves the integrity of the historical record. Hard deleting a bucket would make old income records "orphaned" and impossible to audit.
7.  **Block Income Edits**: A design choice to favor security and simplicity. Force-recreating an income ensures that the complex allocation logic is re-run from scratch, preventing "stale" splits.

---

## SECTION 10 — KNOWN LIMITATIONS

1.  **Stale Reconciliation**: The auto-check inside the rebuild endpoint might occasionally show a mismatch in the same response due to DB replication lag. A manual refresh always shows the correct state.
2.  **Authentication**: The current version uses a hardcoded `DEMO_USER_ID`. Multi-tenant auth is planned for future iterations.
3.  **Infrastructure**: Docker configurations and CI/CD pipelines are not included in this repository.
4.  **Testing**: Comprehensive unit tests are replaced by a robust manual test script (`src/scripts/comprehensive_session.ts`) that verifies all 11+ edge cases.
