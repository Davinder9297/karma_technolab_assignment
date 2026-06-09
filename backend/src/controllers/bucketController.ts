import mongoose from "mongoose";
import { Request, Response } from "express";
import Bucket from "../models/Bucket";
import BucketBalance from "../models/BucketBalance";
import { bucketSchema } from "../validators";
import { DEMO_USER_ID } from "../utils/constants";

export class BucketController {
  static async create(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = bucketSchema.parse(req.body);
      const bucket = new Bucket({
        ...data,
        userId: DEMO_USER_ID,
      });
      await bucket.save({ session });

      // Initialize balance
      const balance = new BucketBalance({
        userId: DEMO_USER_ID,
        bucketId: bucket._id,
        openingBalance: 0,
        totalCredits: 0,
        totalDebits: 0,
        currentBalance: 0,
        overspentAmount: 0
      });
      await balance.save({ session });

      await session.commitTransaction();
      res.status(201).json({ success: true, data: bucket });
    } catch (error: any) {
      await session.abortTransaction();
      res.status(400).json({ success: false, error: error.message });
    } finally {
      session.endSession();
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const buckets = await Bucket.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(DEMO_USER_ID), 
            isActive: true 
          } 
        },
        {
          $lookup: {
            from: "bucketbalances",
            localField: "_id",
            foreignField: "bucketId",
            as: "balance"
          }
        },
        { $unwind: { path: "$balance", preserveNullAndEmptyArrays: true } }
      ]);
      res.json({ success: true, data: buckets });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const bucket = await Bucket.findOneAndUpdate(
        { _id: id, userId: DEMO_USER_ID },
        req.body,
        { new: true }
      );
      if (!bucket) throw new Error("Bucket not found");
      res.json({ success: true, data: bucket });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
