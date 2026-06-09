import mongoose, { Schema, Document } from "mongoose";

export interface IMonthlyBucketSummary extends Document {
  userId: mongoose.Types.ObjectId;
  bucketId: mongoose.Types.ObjectId;
  year: number;
  month: number; // 1-12
  credits: number;
  debits: number;
  netChange: number;
  entryCount: number;
  updatedAt: Date;
}

const MonthlyBucketSummarySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bucketId: { type: Schema.Types.ObjectId, ref: "Bucket", required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    credits: { type: Number, default: 0 },
    debits: { type: Number, default: 0 },
    netChange: { type: Number, default: 0 },
    entryCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

MonthlyBucketSummarySchema.index({ userId: 1, year: 1, month: 1 });
MonthlyBucketSummarySchema.index({ userId: 1, bucketId: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model<IMonthlyBucketSummary>("MonthlyBucketSummary", MonthlyBucketSummarySchema);
