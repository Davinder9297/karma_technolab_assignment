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
    description: string,
    force: boolean = false
  ) {
    // 0. Check for duplicate if force is not true
    if (!force) {
      const duplicateQuery = {
        userId: new mongoose.Types.ObjectId(userId),
        incomeTypeId: new mongoose.Types.ObjectId(incomeTypeId),
        amount: amountPaise,
        date: new Date(date),
        description,
        status: IncomeStatus.ACTIVE
      };
      
      const duplicate = await Income.findOne(duplicateQuery);

      if (duplicate) {
        throw new Error("Potential duplicate income detected. Use 'force' flag to submit anyway.");
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

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
          bucketName: s.bucketName,
          amount: s.amount,
          ruleType: s.ruleType,
          ruleValue: s.ruleValue,
          note: s.note,
        })),
      });

      await income.save({ session });

      // 4. Create Ledger Entries and Update Balances
      for (const split of splits) {
        if (!split.bucketId) continue;

        const currentBalance = await BalanceService.getBalanceAfter(userId, split.bucketId, session);
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

        await ledgerEntry.save({ session });

        await BalanceService.updateBalance(
          userId,
          split.bucketId,
          split.amount,
          TransactionType.CREDIT,
          EntryType.ALLOCATION,
          date,
          ledgerEntry._id as mongoose.Types.ObjectId,
          session
        );
      }

      await session.commitTransaction();
      
      // Fetch with population to ensure the UI has all names
      const populatedIncome = await Income.findById(income._id)
        .populate("incomeTypeId", "name")
        .populate("allocations.bucketId", "name");
      return populatedIncome || income;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async reverseIncome(userId: string, incomeId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const income = await Income.findOne({ _id: incomeId, userId, status: IncomeStatus.ACTIVE }).session(session);
      if (!income) throw new Error("Income not found or already reversed");

      income.status = IncomeStatus.REVERSED;
      await income.save({ session });

      for (const allocation of income.allocations) {
        if (!allocation.bucketId) continue;

        const currentBalance = await BalanceService.getBalanceAfter(userId, allocation.bucketId.toString(), session);
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

        await ledgerEntry.save({ session });

        await BalanceService.updateBalance(
          userId,
          allocation.bucketId.toString(),
          allocation.amount,
          TransactionType.DEBIT,
          EntryType.REVERSAL,
          new Date(),
          ledgerEntry._id as mongoose.Types.ObjectId,
          session
        );
      }

      await session.commitTransaction();
      return income;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
