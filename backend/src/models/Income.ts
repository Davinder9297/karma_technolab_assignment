import mongoose, { Schema, Document } from "mongoose";
import { IncomeStatus, RuleType } from "../types";

export interface IIncomeAllocation {
  bucketId: mongoose.Types.ObjectId | null;
  bucketName: string;
  amount: number;
  ruleType: RuleType;
  ruleValue: number;
  note?: string;
}

export interface IIncome extends Document {
  userId: mongoose.Types.ObjectId;
  incomeTypeId: mongoose.Types.ObjectId;
  allocationRuleId: mongoose.Types.ObjectId;
  allocationRuleVersion: number;
  amount: number; // paise
  date: Date;
  description?: string;
  status: IncomeStatus;
  allocations: IIncomeAllocation[];
  createdAt: Date;
  updatedAt: Date;
}

const IncomeAllocationSchema = new Schema({
  bucketId: { type: Schema.Types.ObjectId, ref: "Bucket" },
  bucketName: { type: String, required: true },
  amount: { type: Number, required: true },
  ruleType: { type: String, enum: Object.values(RuleType), required: true },
  ruleValue: { type: Number, required: true },
  note: { type: String },
});

const IncomeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    incomeTypeId: { type: Schema.Types.ObjectId, ref: "IncomeType", required: true },
    allocationRuleId: { type: Schema.Types.ObjectId, ref: "AllocationRule", required: true },
    allocationRuleVersion: { type: Number, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    status: { type: String, enum: Object.values(IncomeStatus), default: IncomeStatus.ACTIVE },
    allocations: [IncomeAllocationSchema],
  },
  { timestamps: true }
);

IncomeSchema.index({ userId: 1, date: -1 });
IncomeSchema.index({ userId: 1, incomeTypeId: 1 });
IncomeSchema.index({ userId: 1, allocationRuleId: 1 });
IncomeSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IIncome>("Income", IncomeSchema);
