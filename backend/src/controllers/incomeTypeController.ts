import { Request, Response } from "express";
import IncomeType from "../models/IncomeType";
import { incomeTypeSchema } from "../validators";
import { DEMO_USER_ID } from "../utils/constants";

export class IncomeTypeController {
  static async create(req: Request, res: Response) {
    try {
      const data = incomeTypeSchema.parse(req.body);
      const incomeType = new IncomeType({
        ...data,
        userId: DEMO_USER_ID,
      });
      await incomeType.save();
      res.status(201).json({ success: true, data: incomeType });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const incomeTypes = await IncomeType.find({ userId: DEMO_USER_ID, isActive: true });
      res.json({ success: true, data: incomeTypes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const incomeType = await IncomeType.findOneAndUpdate(
        { _id: id, userId: DEMO_USER_ID },
        req.body,
        { new: true }
      );
      if (!incomeType) throw new Error("Income type not found");
      res.json({ success: true, data: incomeType });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
