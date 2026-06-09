import { Request, Response } from "express";
import { reconciliationSchema } from "../validators";
import { ReconciliationService } from "../services/reconciliationService";
import ReconciliationRun from "../models/ReconciliationRun";
import { DEMO_USER_ID, DEFAULT_PAGE_LIMIT } from "../utils/constants";

export class ReconciliationController {
  static async run(req: Request, res: Response) {
    try {
      const data = reconciliationSchema.parse(req.body);
      const result = await ReconciliationService.runReconciliation(DEMO_USER_ID, data.year, data.month);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async rebuild(req: Request, res: Response) {
    try {
      const result = await ReconciliationService.rebuildBalances(DEMO_USER_ID);
      res.json({ success: true, rebuilt: true, reconciliation: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const { page = 1, limit = DEFAULT_PAGE_LIMIT } = req.query;
      const query = { userId: DEMO_USER_ID };

      const history = await ReconciliationRun.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await ReconciliationRun.countDocuments(query);

      res.json({ 
        success: true, 
        data: history,
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
