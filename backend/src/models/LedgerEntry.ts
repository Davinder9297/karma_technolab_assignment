import mongoose, { Schema, Document } from "mongoose";
import { TransactionType, EntryType } from "../types";

export interface ILedgerEntry extends Document {
  userId: mongoose.Types.ObjectId;
  bucketId: mongoose.Types.ObjectId;
  incomeTypeId: mongoose.Types.ObjectId | null;
  referenceId: mongoose.Types.ObjectId;
  referenceModel: "Income" | "Expense";
  transactionType: TransactionType;
  entryType: EntryType;
  amount: number; // paise
  balanceAfter: number; // paise
  allocationRuleId: mongoose.Types.ObjectId | null;
  allocationRuleVersion: number | null;
  date: Date;
  description: string;
  createdAt: Date;
}

const LedgerEntrySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bucketId: { type: Schema.Types.ObjectId, ref: "Bucket", required: true },
    incomeTypeId: { type: Schema.Types.ObjectId, ref: "IncomeType", default: null },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    referenceModel: { type: String, enum: ["Income", "Expense"], required: true },
    transactionType: { type: String, enum: Object.values(TransactionType), required: true },
    entryType: { type: String, enum: Object.values(EntryType), required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    allocationRuleId: { type: Schema.Types.ObjectId, ref: "AllocationRule", default: null },
    allocationRuleVersion: { type: Number, default: null },
    date: { type: Date, required: true },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LedgerEntrySchema.index({ userId: 1, bucketId: 1, date: -1 });
LedgerEntrySchema.index({ userId: 1, date: -1 });
LedgerEntrySchema.index({ userId: 1, referenceId: 1 });
LedgerEntrySchema.index({ userId: 1, bucketId: 1, createdAt: -1 });
LedgerEntrySchema.index({ userId: 1, entryType: 1 });
LedgerEntrySchema.index({ userId: 1, bucketId: 1, date: 1, transactionType: 1 });

export default mongoose.model<ILedgerEntry>("LedgerEntry", LedgerEntrySchema);
