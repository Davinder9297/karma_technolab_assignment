import { Request, Response } from "express";
import { expenseSchema, updateExpenseSchema } from "../validators";
import { ExpenseService } from "../services/expenseService";
import Expense from "../models/Expense";
import { DEMO_USER_ID, DEFAULT_PAGE_LIMIT } from "../utils/constants";

export class ExpenseController {
  static async create(req: Request, res: Response) {
    try {
      const data = expenseSchema.parse(req.body);
      const amountPaise = Math.round(data.amount * 100);
      
      const expense = await ExpenseService.addExpense(
        DEMO_USER_ID,
        data.bucketId,
        amountPaise,
        new Date(data.date),
        data.description
      );

      res.status(201).json({ success: true, data: expense });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = DEFAULT_PAGE_LIMIT, bucketId, startDate, endDate } = req.query;
      const query: any = { userId: DEMO_USER_ID };
      
      if (bucketId) query.bucketId = bucketId;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      const expenses = await Expense.find(query)
        .sort({ date: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate("bucketId", "name");

      const total = await Expense.countDocuments(query);

      res.json({
        success: true,
        data: expenses,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Expense ID is required");
      
      const data = updateExpenseSchema.parse(req.body);
      
      if (data.amount === undefined || data.description === undefined) {
        throw new Error("Amount and description are required for update");
      }

      const amountPaise = Math.round(data.amount * 100);

      const expense = await ExpenseService.updateExpense(
        DEMO_USER_ID,
        id as string,
        amountPaise,
        data.description
      );

      res.json({ success: true, data: expense });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) throw new Error("Expense ID is required");
      const expense = await ExpenseService.deleteExpense(DEMO_USER_ID, id as string);
      res.json({ success: true, data: expense });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
