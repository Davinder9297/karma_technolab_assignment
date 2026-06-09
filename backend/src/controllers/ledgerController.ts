import { Request, Response } from "express";
import LedgerEntry from "../models/LedgerEntry";
import { DEMO_USER_ID } from "../utils/constants";

export class LedgerController {
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, bucketId, entryType, transactionType, startDate, endDate } = req.query;
      const query: any = { userId: DEMO_USER_ID };
      
      if (bucketId) query.bucketId = bucketId;
      if (entryType && entryType !== "ALL") query.entryType = entryType;
      if (transactionType && transactionType !== "ALL") query.transactionType = transactionType;
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      const entries = await LedgerEntry.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate("bucketId", "name")
        .populate("incomeTypeId", "name");

      const total = await LedgerEntry.countDocuments(query);

      res.json({
        success: true,
        data: entries,
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
}
