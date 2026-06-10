import mongoose from "mongoose";
import LedgerEntry from "../models/LedgerEntry";
import BucketBalance from "../models/BucketBalance";
import Bucket from "../models/Bucket";
import ReconciliationRun from "../models/ReconciliationRun";
import { TransactionType, BucketStatus, ReconciliationStatus } from "../types";

export class ReconciliationService {
  static async runReconciliation(userId: string, year: number, month: number) {
    const buckets = await Bucket.find({ userId, isActive: true });
    const results = [];
    let matchedCount = 0;
    let mismatchedCount = 0;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    for (const bucket of buckets) {
      // 1. Calculate expected balance from ledger
      const ledgerStats = await LedgerEntry.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            bucketId: bucket._id,
            date: { $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalCredits: {
              $sum: { $cond: [{ $eq: ["$transactionType", TransactionType.CREDIT] }, "$amount", 0] },
            },
            totalDebits: {
              $sum: { $cond: [{ $eq: ["$transactionType", TransactionType.DEBIT] }, "$amount", 0] },
            },
          },
        },
      ]);

      const stats = ledgerStats[0] || { totalCredits: 0, totalDebits: 0 };
      const expectedBalance = stats.totalCredits - stats.totalDebits;

      // 2. Get stored balance
      const balanceDoc = await BucketBalance.findOne({ userId, bucketId: bucket._id });
      const storedBalance = balanceDoc ? balanceDoc.currentBalance : 0;

      const difference = expectedBalance - storedBalance;
      const status = difference === 0 ? BucketStatus.MATCHED : BucketStatus.MISMATCHED;

      if (status === BucketStatus.MATCHED) matchedCount++;
      else mismatchedCount++;

      results.push({
        bucketId: bucket._id,
        bucketName: bucket.name,
        expectedBalance,
        storedBalance,
        difference,
        status,
      });
    }

    const run = new ReconciliationRun({
      userId,
      year,
      month,
      runType: "CHECK",
      status: mismatchedCount === 0 ? ReconciliationStatus.MATCHED : ReconciliationStatus.MISMATCHED,
      totalBuckets: buckets.length,
      matchedCount,
      mismatchedCount,
      results,
    });

    await run.save();
    return run;
  }

  static async rebuildBalances(userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const buckets = await Bucket.find({ userId }).session(session);
      
      for (const bucket of buckets) {
        const ledgerStats = await LedgerEntry.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              bucketId: bucket._id,
            },
          },
          {
            $group: {
              _id: null,
              totalCredits: {
                $sum: { $cond: [{ $eq: ["$transactionType", TransactionType.CREDIT] }, "$amount", 0] },
              },
              totalDebits: {
                $sum: { $cond: [{ $eq: ["$transactionType", TransactionType.DEBIT] }, "$amount", 0] },
              },
              lastEntry: { $last: "$_id" }
            },
          },
        ]).session(session);

        const stats = ledgerStats[0] || { totalCredits: 0, totalDebits: 0, lastEntry: null };
        const currentBalance = stats.totalCredits - stats.totalDebits;

        await BucketBalance.findOneAndUpdate(
          { userId, bucketId: bucket._id },
          {
            $set: {
              totalCredits: stats.totalCredits,
              totalDebits: stats.totalDebits,
              currentBalance,
              overspentAmount: Math.max(0, -currentBalance),
              lastLedgerEntryId: stats.lastEntry,
            },
          },
          { upsert: true, session }
        );
      }

      // Run reconciliation after rebuild
      const now = new Date();
      const run = await this.runReconciliation(userId, now.getFullYear(), now.getMonth() + 1);
      
      // Fetch the document again to ensure we have a fresh instance from the session if needed
      // or just update it via findOneAndUpdate to avoid version conflicts/document not found errors
      await ReconciliationRun.updateOne(
        { _id: run._id },
        { 
          $set: { 
            runType: "REBUILD",
            status: ReconciliationStatus.REBUILT,
            rebuiltAt: new Date()
          } 
        },
        { session }
      );

      await session.commitTransaction();
      return run;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
