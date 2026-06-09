import mongoose, { Schema, Document } from "mongoose";
import { ExpenseStatus } from "../types";

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  bucketId: mongoose.Types.ObjectId;
  amount: number; // paise
  date: Date;
  description: string;
  status: ExpenseStatus;
  originalExpenseId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bucketId: { type: Schema.Types.ObjectId, ref: "Bucket", required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: Object.values(ExpenseStatus), default: ExpenseStatus.ACTIVE },
    originalExpenseId: { type: Schema.Types.ObjectId, ref: "Expense", default: null },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, bucketId: 1 });
ExpenseSchema.index({ userId: 1, status: 1 });
ExpenseSchema.index({ userId: 1, bucketId: 1, date: -1 });

export default mongoose.model<IExpense>("Expense", ExpenseSchema);
