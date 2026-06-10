import mongoose from "mongoose";
import Expense, { IExpense } from "../models/Expense";
import LedgerEntry from "../models/LedgerEntry";
import { BalanceService } from "./balanceService";
import { ExpenseStatus, TransactionType, EntryType } from "../types";

export class ExpenseService {
  static async addExpense(
    userId: string,
    bucketId: string,
    amountPaise: number,
    date: Date,
    description: string
  ) {
    try {
      const expense = new Expense({
        userId,
        bucketId,
        amount: amountPaise,
        date,
        description,
        status: ExpenseStatus.ACTIVE,
      });

      await expense.save();

      const currentBalance = await BalanceService.getBalanceAfter(userId, bucketId);
      const balanceAfter = currentBalance - amountPaise;

      const ledgerEntry = new LedgerEntry({
        userId,
        bucketId,
        referenceId: expense._id,
        referenceModel: "Expense",
        transactionType: TransactionType.DEBIT,
        entryType: EntryType.EXPENSE,
        amount: amountPaise,
        balanceAfter,
        date,
        description: `Expense: ${description}`,
      });

      await ledgerEntry.save();

      await BalanceService.updateBalance(
        userId,
        bucketId,
        amountPaise,
        TransactionType.DEBIT,
        EntryType.EXPENSE,
        date,
        ledgerEntry._id as mongoose.Types.ObjectId
      );

      return expense;
    } catch (error) {
      throw error;
    }
  }

  static async updateExpense(
    userId: string,
    expenseId: string,
    newAmount: number,
    newDescription: string,
    newDate?: Date
  ) {
    // 1. Find original expense
    const originalExpense = await Expense.findOne({
      _id: expenseId,
      userId
    });

    if (!originalExpense) throw new Error("Expense not found");
    if (originalExpense.status === ExpenseStatus.DELETED) {
      throw new Error("Cannot edit a deleted expense");
    }

    const amountChanged = newAmount !== originalExpense.amount;

    if (!amountChanged) {
      // SCENARIO A: Only non-financial fields changed
      originalExpense.description = newDescription;
      if (newDate) originalExpense.date = newDate;
      await originalExpense.save();
      return originalExpense;
    }

    // SCENARIO B: Amount changed - Run full audit flow
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 2. Get original amount (in paise)
      const originalAmount = originalExpense.amount;

      // 3. Update original expense doc
      originalExpense.status = ExpenseStatus.UPDATED;
      originalExpense.description = newDescription;
      originalExpense.amount = newAmount;
      if (newDate) originalExpense.date = newDate;
      await originalExpense.save({ session });

      const auditDate = new Date();

      // 4. Create REVERSAL ledger entry
      const currentBalanceBeforeReversal = await BalanceService.getBalanceAfter(userId, originalExpense.bucketId.toString(), session);
      const balanceAfterReversal = currentBalanceBeforeReversal + originalAmount;

      const reversalEntry = new LedgerEntry({
        userId,
        bucketId: originalExpense.bucketId,
        referenceId: originalExpense._id,
        referenceModel: "Expense",
        transactionType: TransactionType.CREDIT,
        entryType: EntryType.REVERSAL,
        amount: originalAmount,
        balanceAfter: balanceAfterReversal,
        date: auditDate,
        description: `Reversal for update: ${originalExpense.description}`,
      });
      await reversalEntry.save({ session });

      // Update balance for reversal
      await BalanceService.updateBalance(
        userId,
        originalExpense.bucketId.toString(),
        originalAmount,
        TransactionType.CREDIT,
        EntryType.REVERSAL,
        auditDate,
        reversalEntry._id as mongoose.Types.ObjectId,
        session
      );

      // 5. Create ADJUSTMENT ledger entry
      const currentBalanceBeforeAdjustment = await BalanceService.getBalanceAfter(userId, originalExpense.bucketId.toString(), session);
      const balanceAfterAdjustment = currentBalanceBeforeAdjustment - newAmount;

      const adjustmentEntry = new LedgerEntry({
        userId,
        bucketId: originalExpense.bucketId,
        referenceId: originalExpense._id,
        referenceModel: "Expense",
        transactionType: TransactionType.DEBIT,
        entryType: EntryType.ADJUSTMENT,
        amount: newAmount,
        balanceAfter: balanceAfterAdjustment,
        date: auditDate,
        description: `Adjustment for update: ${newDescription}`,
      });
      await adjustmentEntry.save({ session });

      // Update balance for adjustment
      await BalanceService.updateBalance(
        userId,
        originalExpense.bucketId.toString(),
        newAmount,
        TransactionType.DEBIT,
        EntryType.ADJUSTMENT,
        auditDate,
        adjustmentEntry._id as mongoose.Types.ObjectId,
        session
      );

      await session.commitTransaction();
      return originalExpense;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async deleteExpense(userId: string, expenseId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const expense = await Expense.findOne({
        _id: expenseId,
        userId,
        status: ExpenseStatus.ACTIVE,
      }).session(session);

      if (!expense) throw new Error("Expense not found or not active");

      expense.status = ExpenseStatus.DELETED;
      await expense.save({ session });

      const currentBalance = await BalanceService.getBalanceAfter(userId, expense.bucketId.toString(), session);
      const balanceAfter = currentBalance + expense.amount;

      const ledgerEntry = new LedgerEntry({
        userId,
        bucketId: expense.bucketId,
        referenceId: expense._id,
        referenceModel: "Expense",
        transactionType: TransactionType.CREDIT,
        entryType: EntryType.REVERSAL,
        amount: expense.amount,
        balanceAfter,
        date: new Date(),
        description: `Reversal of expense: ${expense.description}`,
      });

      await ledgerEntry.save({ session });

      await BalanceService.updateBalance(
        userId,
        expense.bucketId.toString(),
        expense.amount,
        TransactionType.CREDIT,
        EntryType.REVERSAL,
        new Date(),
        ledgerEntry._id as mongoose.Types.ObjectId,
        session
      );

      await session.commitTransaction();
      return expense;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
