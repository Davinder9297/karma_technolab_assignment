import mongoose, { Schema, Document } from "mongoose";

export interface IBucketBalance extends Document {
  userId: mongoose.Types.ObjectId;
  bucketId: mongoose.Types.ObjectId;
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  currentBalance: number;
  overspentAmount: number;
  lastLedgerEntryId: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const BucketBalanceSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bucketId: { type: Schema.Types.ObjectId, ref: "Bucket", required: true },
    openingBalance: { type: Number, default: 0 },
    totalCredits: { type: Number, default: 0 },
    totalDebits: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    overspentAmount: { type: Number, default: 0 },
    lastLedgerEntryId: { type: Schema.Types.ObjectId, ref: "LedgerEntry" },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

BucketBalanceSchema.index({ userId: 1, bucketId: 1 }, { unique: true });

export default mongoose.model<IBucketBalance>("BucketBalance", BucketBalanceSchema);
