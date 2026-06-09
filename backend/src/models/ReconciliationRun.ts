import mongoose, { Schema, Document } from "mongoose";
import { ReconciliationStatus, BucketStatus } from "../types";

export interface IReconciliationResult {
  bucketId: mongoose.Types.ObjectId;
  bucketName: string;
  expectedBalance: number;
  storedBalance: number;
  difference: number;
  status: BucketStatus;
}

export interface IReconciliationRun extends Document {
  userId: mongoose.Types.ObjectId;
  year: number;
  month: number;
  runType: "CHECK" | "REBUILD";
  status: ReconciliationStatus;
  totalBuckets: number;
  matchedCount: number;
  mismatchedCount: number;
  results: IReconciliationResult[];
  rebuiltAt: Date | null;
  createdAt: Date;
}

const ReconciliationResultSchema = new Schema({
  bucketId: { type: Schema.Types.ObjectId, ref: "Bucket", required: true },
  bucketName: { type: String, required: true },
  expectedBalance: { type: Number, required: true },
  storedBalance: { type: Number, required: true },
  difference: { type: Number, required: true },
  status: { type: String, enum: Object.values(BucketStatus), required: true },
});

const ReconciliationRunSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    runType: { type: String, enum: ["CHECK", "REBUILD"], required: true },
    status: { type: String, enum: Object.values(ReconciliationStatus), required: true },
    totalBuckets: { type: Number, required: true },
    matchedCount: { type: Number, required: true },
    mismatchedCount: { type: Number, required: true },
    results: [ReconciliationResultSchema],
    rebuiltAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReconciliationRunSchema.index({ userId: 1, createdAt: -1 });
ReconciliationRunSchema.index({ userId: 1, year: 1, month: 1 });

export default mongoose.model<IReconciliationRun>("ReconciliationRun", ReconciliationRunSchema);
