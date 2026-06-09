import mongoose, { Schema, Document } from "mongoose";
import { RuleType } from "../types";

export interface IRule {
  bucketId: mongoose.Types.ObjectId;
  ruleType: RuleType;
  value: number; // paise if FIXED, basis points if PERCENTAGE
  priority: number;
}

export interface IAllocationRule extends Document {
  userId: mongoose.Types.ObjectId;
  incomeTypeId: mongoose.Types.ObjectId;
  version: number;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  rules: IRule[];
  totalPercentage: number; // in basis points
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const RuleSchema = new Schema({
  bucketId: { type: Schema.Types.ObjectId, ref: "Bucket", required: true },
  ruleType: { type: String, enum: Object.values(RuleType), required: true },
  value: { type: Number, required: true },
  priority: { type: Number, default: 0 },
});

const AllocationRuleSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    incomeTypeId: { type: Schema.Types.ObjectId, ref: "IncomeType", required: true },
    version: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null },
    rules: [RuleSchema],
    totalPercentage: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AllocationRuleSchema.index({ userId: 1, incomeTypeId: 1, version: 1 }, { unique: true });
AllocationRuleSchema.index({ userId: 1, incomeTypeId: 1, isActive: 1 });
AllocationRuleSchema.index({ userId: 1, incomeTypeId: 1, effectiveFrom: -1 });

export default mongoose.model<IAllocationRule>("AllocationRule", AllocationRuleSchema);
