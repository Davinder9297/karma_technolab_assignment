import { Request, Response } from "express";
import { incomeSchema } from "../validators";
import { IncomeService } from "../services/incomeService";
import Income from "../models/Income";
import { DEMO_USER_ID, DEFAULT_PAGE_LIMIT } from "../utils/constants";

export class IncomeController {
  static async create(req: Request, res: Response) {
    try {
      const data = incomeSchema.parse(req.body);
      const amountPaise = Math.round(data.amount * 100);
      
      const income = await IncomeService.allocateIncome(
        DEMO_USER_ID,
        data.incomeTypeId,
        amountPaise,
        new Date(data.date),
        data.description || ""
      );

      res.status(201).json({ success: true, data: income });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = DEFAULT_PAGE_LIMIT, incomeTypeId, startDate, endDate } = req.query;
      const query: any = { userId: DEMO_USER_ID };
      
      if (incomeTypeId) query.incomeTypeId = incomeTypeId;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      const incomes = await Income.find(query)
        .sort({ date: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate("incomeTypeId", "name")
        .populate("allocations.bucketId", "name");

      const total = await Income.countDocuments(query);

      res.json({
        success: true,
        data: incomes,
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
      const { description } = req.body;
      const income = await Income.findOneAndUpdate(
        { _id: id, userId: DEMO_USER_ID },
        { description },
        { new: true }
      );
      if (!income) throw new Error("Income not found");
      res.json({ success: true, data: income });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const income = await IncomeService.reverseIncome(DEMO_USER_ID, id);
      res.json({ success: true, data: income });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
