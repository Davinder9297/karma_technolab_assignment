import mongoose from "mongoose";
import BucketBalance from "../models/BucketBalance";
import MonthlyBucketSummary from "../models/MonthlyBucketSummary";
import LedgerEntry from "../models/LedgerEntry";
import { TransactionType, EntryType } from "../types";

export class BalanceService {
  static async updateBalance(
    userId: string,
    bucketId: string,
    amount: number, // paise, always positive
    transactionType: TransactionType,
    entryType: EntryType,
    date: Date,
    ledgerEntryId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
  ) {
    const isCredit = transactionType === TransactionType.CREDIT;
    const updateAmount = isCredit ? amount : -amount;

    let balanceInc: any = {
      currentBalance: updateAmount
    };

    let summaryInc: any = {
      netChange: updateAmount,
      entryCount: 1
    };

    // Determine whether to update totalCredits or totalDebits
    if (entryType === EntryType.ALLOCATION) {
      // Income always updates credits
      balanceInc.totalCredits = amount;
      summaryInc.credits = amount;
    } else if (entryType === EntryType.EXPENSE) {
      // Expense always updates debits
      balanceInc.totalDebits = amount;
      summaryInc.debits = amount;
    } else if (entryType === EntryType.REVERSAL) {
      if (isCredit) {
        // Reversing an expense: decrease debits
        balanceInc.totalDebits = -amount;
        summaryInc.debits = -amount;
      } else {
        // Reversing an income: decrease credits
        balanceInc.totalCredits = -amount;
        summaryInc.credits = -amount;
      }
    } else if (entryType === EntryType.ADJUSTMENT) {
      // Adjustment currently only for expenses
      if (isCredit) {
        // Reduced expense: decrease debits
        balanceInc.totalDebits = -amount;
        summaryInc.debits = -amount;
      } else {
        // Increased expense: increase debits
        balanceInc.totalDebits = amount;
        summaryInc.debits = amount;
      }
    }

    // 1. Update BucketBalance
    const balance = await BucketBalance.findOneAndUpdate(
      { userId, bucketId },
      {
        $inc: balanceInc,
        $set: {
          lastLedgerEntryId: ledgerEntryId,
        },
      },
      { upsert: true, new: true, session }
    );

    // Update overspentAmount
    balance.overspentAmount = Math.max(0, -balance.currentBalance);
    await balance.save({ session });

    // 2. Update MonthlyBucketSummary
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    await MonthlyBucketSummary.findOneAndUpdate(
      { userId, bucketId, year, month },
      {
        $inc: summaryInc,
      },
      { upsert: true, session }
    );

    return balance;
  }

  static async getBalanceAfter(userId: string, bucketId: string, session?: mongoose.ClientSession) {
    const balance = await BucketBalance.findOne({ userId, bucketId }).session(session || null);
    return balance ? balance.currentBalance : 0;
  }
}
