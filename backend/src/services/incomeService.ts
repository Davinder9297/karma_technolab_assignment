import mongoose from "mongoose";
import Income, { IIncome } from "../models/Income";
import LedgerEntry from "../models/LedgerEntry";
import { AllocationService } from "./allocationService";
import { BalanceService } from "./balanceService";
import { IncomeStatus, TransactionType, EntryType } from "../types";

export class IncomeService {
  static async allocateIncome(
    userId: string,
    incomeTypeId: string,
    amountPaise: number,
    date: Date,
    description: string
  ) {
    // Note: Transactions are disabled for local development without replica sets.
    // In production, use: const session = await mongoose.startSession(); session.startTransaction();

    try {
      // 1. Get Rule
      const rule = await AllocationService.getAllocationRule(userId, incomeTypeId, date);

      // 2. Calculate Splits
      const splits = await AllocationService.calculateSplits(userId, rule, amountPaise);

      // 3. Create Income Document
      const income = new Income({
        userId,
        incomeTypeId,
        allocationRuleId: rule._id,
        allocationRuleVersion: rule.version,
        amount: amountPaise,
        date,
        description,
        status: IncomeStatus.ACTIVE,
        allocations: splits.map((s) => ({
          bucketId: s.bucketId,
          amount: s.amount,
          ruleType: s.ruleType,
          ruleValue: s.ruleValue,
          note: s.note,
        })),
      });

      await income.save();

      // 4. Create Ledger Entries and Update Balances
      for (const split of splits) {
        if (!split.bucketId) continue;

        const currentBalance = await BalanceService.getBalanceAfter(userId, split.bucketId);
        const balanceAfter = currentBalance + split.amount;

        const ledgerEntry = new LedgerEntry({
          userId,
          bucketId: split.bucketId,
          incomeTypeId,
          referenceId: income._id,
          referenceModel: "Income",
          transactionType: TransactionType.CREDIT,
          entryType: EntryType.ALLOCATION,
          amount: split.amount,
          balanceAfter,
          allocationRuleId: rule._id,
          allocationRuleVersion: rule.version,
          date,
          description: `Allocation from income: ${description || "No description"}`,
        });

        await ledgerEntry.save();

        await BalanceService.updateBalance(
          userId,
          split.bucketId,
          split.amount,
          TransactionType.CREDIT,
          EntryType.ALLOCATION,
          date,
          ledgerEntry._id as mongoose.Types.ObjectId
        );
      }

      return income;
    } catch (error) {
      throw error;
    }
  }

  static async reverseIncome(userId: string, incomeId: string) {
    try {
      const income = await Income.findOne({ _id: incomeId, userId, status: IncomeStatus.ACTIVE });
      if (!income) throw new Error("Income not found or already reversed");

      income.status = IncomeStatus.REVERSED;
      await income.save();

      for (const allocation of income.allocations) {
        if (!allocation.bucketId) continue;

        const currentBalance = await BalanceService.getBalanceAfter(userId, allocation.bucketId.toString());
        const balanceAfter = currentBalance - allocation.amount;

        const ledgerEntry = new LedgerEntry({
          userId,
          bucketId: allocation.bucketId,
          incomeTypeId: income.incomeTypeId,
          referenceId: income._id,
          referenceModel: "Income",
          transactionType: TransactionType.DEBIT,
          entryType: EntryType.REVERSAL,
          amount: allocation.amount,
          balanceAfter,
          date: new Date(),
          description: `Reversal of income: ${income.description || "No description"}`,
        });

        await ledgerEntry.save();

        await BalanceService.updateBalance(
          userId,
          allocation.bucketId.toString(),
          allocation.amount,
          TransactionType.DEBIT,
          EntryType.REVERSAL,
          new Date(),
          ledgerEntry._id as mongoose.Types.ObjectId
        );
      }

      return income;
    } catch (error) {
      throw error;
    }
  }
}
