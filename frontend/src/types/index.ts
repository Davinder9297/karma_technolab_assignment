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

export interface Bucket {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  balance?: {
    currentBalance: number;
  };
}

export interface IncomeType {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AllocationRule {
  _id: string;
  incomeTypeId: string;
  version: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  rules: {
    bucketId: string;
    ruleType: RuleType;
    value: number;
    priority: number;
  }[];
  totalPercentage: number;
}

export interface Income {
  _id: string;
  incomeTypeId: any;
  amount: number;
  date: string;
  description?: string;
  status: IncomeStatus;
  allocationRuleVersion: number;
  allocations: {
    bucketId: string | null;
    bucketName: string;
    amount: number;
    ruleType: RuleType;
    ruleValue: number;
    note?: string;
  }[];
}

export interface Expense {
  _id: string;
  bucketId: any;
  amount: number;
  date: string;
  description: string;
  status: ExpenseStatus;
}

export interface LedgerEntry {
  _id: string;
  bucketId: any;
  incomeTypeId?: any;
  transactionType: TransactionType;
  entryType: EntryType;
  amount: number;
  balanceAfter: number;
  date: string;
  createdAt: string;
  description: string;
  referenceModel: string;
  allocationRuleVersion?: number;
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

export interface ReconciliationRun {
  _id: string;
  year: number;
  month: number;
  runType: string;
  status: string;
  totalBuckets: number;
  matchedCount: number;
  mismatchedCount: number;
  createdAt: string;
  results: {
    bucketId: string;
    bucketName: string;
    expectedBalance: number;
    storedBalance: number;
    difference: number;
    status: string;
  }[];
}
