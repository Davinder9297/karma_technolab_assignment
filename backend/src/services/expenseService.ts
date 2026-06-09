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
    newAmount?: number,
    newDescription?: string,
    newDate?: Date
  ) {
    try {
      const originalExpense = await Expense.findOne({
        _id: expenseId,
        userId,
        status: ExpenseStatus.ACTIVE,
      });

      if (!originalExpense) throw new Error("Expense not found or not active");

      const amountDiff = (newAmount !== undefined ? newAmount : originalExpense.amount) - originalExpense.amount;
      
      const updatedExpense = new Expense({
        userId,
        bucketId: originalExpense.bucketId,
        amount: newAmount !== undefined ? newAmount : originalExpense.amount,
        date: newDate || originalExpense.date,
        description: newDescription || originalExpense.description,
        status: ExpenseStatus.ACTIVE,
        originalExpenseId: originalExpense._id,
      });

      await updatedExpense.save();

      originalExpense.status = ExpenseStatus.UPDATED;
      await originalExpense.save();

      if (amountDiff !== 0) {
        const transactionType = amountDiff > 0 ? TransactionType.DEBIT : TransactionType.CREDIT;
        const absDiff = Math.abs(amountDiff);
        
        const currentBalance = await BalanceService.getBalanceAfter(userId, originalExpense.bucketId.toString());
        const balanceAfter = currentBalance + (amountDiff > 0 ? -absDiff : absDiff);

        const ledgerEntry = new LedgerEntry({
          userId,
          bucketId: originalExpense.bucketId,
          referenceId: updatedExpense._id,
          referenceModel: "Expense",
          transactionType,
          entryType: EntryType.ADJUSTMENT,
          amount: absDiff,
          balanceAfter,
          date: new Date(),
          description: `Adjustment for expense: ${originalExpense.description}`,
        });

        await ledgerEntry.save();

        await BalanceService.updateBalance(
          userId,
          originalExpense.bucketId.toString(),
          absDiff,
          transactionType,
          EntryType.ADJUSTMENT,
          new Date(),
          ledgerEntry._id as mongoose.Types.ObjectId
        );
      }

      return updatedExpense;
    } catch (error) {
      throw error;
    }
  }

  static async deleteExpense(userId: string, expenseId: string) {
    try {
      const expense = await Expense.findOne({
        _id: expenseId,
        userId,
        status: ExpenseStatus.ACTIVE,
      });

      if (!expense) throw new Error("Expense not found or not active");

      expense.status = ExpenseStatus.DELETED;
      await expense.save();

      const currentBalance = await BalanceService.getBalanceAfter(userId, expense.bucketId.toString());
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

      await ledgerEntry.save();

      await BalanceService.updateBalance(
        userId,
        expense.bucketId.toString(),
        expense.amount,
        TransactionType.CREDIT,
        EntryType.REVERSAL,
        new Date(),
        ledgerEntry._id as mongoose.Types.ObjectId
      );

      return expense;
    } catch (error) {
      throw error;
    }
  }
}
