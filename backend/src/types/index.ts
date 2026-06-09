export enum TransactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
}

export enum EntryType {
  ALLOCATION = "ALLOCATION",
  EXPENSE = "EXPENSE",
  REVERSAL = "REVERSAL",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum RuleType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

export enum IncomeStatus {
  ACTIVE = "ACTIVE",
  REVERSED = "REVERSED",
}

export enum ExpenseStatus {
  ACTIVE = "ACTIVE",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
}

export enum ReconciliationStatus {
  MATCHED = "MATCHED",
  MISMATCHED = "MISMATCHED",
  REBUILT = "REBUILT",
}

export enum BucketStatus {
  MATCHED = "MATCHED",
  MISMATCHED = "MISMATCHED",
}

export interface AllocationResult {
  bucketId: string | null;
  bucketName: string;
  amount: number; // paise
  amountINR: number; // rupees (for display)
  ruleType: RuleType;
  ruleValue: number;
  note?: string; // "unallocated" | "rounding_adjustment"
}

export interface DashboardBucket {
  bucket: { _id: string; name: string; description: string };
  balance: {
    openingBalance: number;
    totalCredits: number;
    totalDebits: number;
    currentBalance: number;
    overspentAmount: number;
  };
  thisMonth: { credits: number; debits: number; netChange: number };
}

export interface ReconciliationResult {
  bucketId: string;
  bucketName: string;
  expectedBalance: number;
  storedBalance: number;
  difference: number;
  status: BucketStatus;
}
