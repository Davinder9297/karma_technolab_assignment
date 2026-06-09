import mongoose, { Schema, Document } from "mongoose";

export interface IIncomeType extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeTypeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

IncomeTypeSchema.index({ userId: 1 });
IncomeTypeSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<IIncomeType>("IncomeType", IncomeTypeSchema);
