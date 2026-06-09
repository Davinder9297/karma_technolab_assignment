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
- **MongoDB**: A running instance on `mongodb://localhost:27017` (default).

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

## 📊 Core Concepts

### Income Allocation Flow
When an income is added:
1. The system fetches the active **Allocation Rule** for that income type.
2. It calculates the splits (Fixed first, then Percentages).
3. Any remainder from rounding is added to the highest percentage bucket.
4. If the rule totals < 100%, the remainder is marked as **Unallocated**.
5. **Ledger Entries** are created for each bucket allocation.

### Ledger Auditing
The system maintains an append-only ledger. Reversing an income or expense does not delete records; instead, it creates a **Reversal** entry that offsets the balance, preserving the historical trail.

### Maintenance Scripts
- `npm run clear`: Clears all transactions but keeps buckets and rules.
- `npm run seed`: Resets everything to a demo state.
- `Rebuild Balances` (via UI): Recalculates all bucket balances from the ledger history if a mismatch is detected.
