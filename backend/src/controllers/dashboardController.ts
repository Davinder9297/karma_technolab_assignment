import { Request, Response } from "express";
import Bucket from "../models/Bucket";
import BucketBalance from "../models/BucketBalance";
import MonthlyBucketSummary from "../models/MonthlyBucketSummary";
import { DEMO_USER_ID } from "../utils/constants";

export class DashboardController {
  static async getBuckets(req: Request, res: Response) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const buckets = await Bucket.find({ userId: DEMO_USER_ID, isActive: true });
      const dashboardData = [];

      for (const bucket of buckets) {
        const balance = await BucketBalance.findOne({ userId: DEMO_USER_ID, bucketId: bucket._id });
        const summary = await MonthlyBucketSummary.findOne({ 
          userId: DEMO_USER_ID, 
          bucketId: bucket._id,
          year,
          month
        });

        dashboardData.push({
          bucket: {
            _id: bucket._id,
            name: bucket.name,
            description: bucket.description
          },
          balance: balance ? {
            openingBalance: balance.openingBalance,
            totalCredits: balance.totalCredits,
            totalDebits: balance.totalDebits,
            currentBalance: balance.currentBalance,
            overspentAmount: balance.overspentAmount
          } : {
            openingBalance: 0,
            totalCredits: 0,
            totalDebits: 0,
            currentBalance: 0,
            overspentAmount: 0
          },
          thisMonth: summary ? {
            credits: summary.credits,
            debits: summary.debits,
            netChange: summary.netChange
          } : {
            credits: 0,
            debits: 0,
            netChange: 0
          }
        });
      }

      res.json({ success: true, data: dashboardData });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
