import mongoose, { Schema, Document } from "mongoose";

export interface IBucket extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BucketSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BucketSchema.index({ userId: 1 });
BucketSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<IBucket>("Bucket", BucketSchema);
