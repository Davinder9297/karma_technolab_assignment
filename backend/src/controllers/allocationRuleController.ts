import mongoose from "mongoose";
import { Request, Response } from "express";
import AllocationRule from "../models/AllocationRule";
import { allocationRuleSchema } from "../validators";
import { DEMO_USER_ID, DEFAULT_PAGE_LIMIT } from "../utils/constants";
import { RuleType } from "../types";

export class AllocationRuleController {
  static async create(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const data = allocationRuleSchema.parse(req.body);
      const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : new Date();
      
      // 1. Check if a rule already exists with the EXACT same effectiveFrom
      const existingConflict = await AllocationRule.findOne({
        userId: DEMO_USER_ID,
        incomeTypeId: data.incomeTypeId,
        effectiveFrom: effectiveFrom
      }).session(session);

      if (existingConflict) {
        throw new Error(`A rule version already exists with effective date ${existingConflict.effectiveFrom.toLocaleDateString()}. Please choose a different date.`);
      }

      // 2. Find current active rule
      const currentRule = await AllocationRule.findOne({
        userId: DEMO_USER_ID,
        incomeTypeId: data.incomeTypeId,
        isActive: true
      }).session(session);

      if (currentRule) {
        currentRule.isActive = false;
        currentRule.effectiveTo = effectiveFrom;
        await currentRule.save({ session });
      }

      const version = currentRule ? currentRule.version + 1 : 1;
      
      // 3. Calculate total percentage in basis points
      const totalPercentage = data.rules
        .filter(r => r.ruleType === RuleType.PERCENTAGE)
        .reduce((sum, r) => sum + r.value, 0);

      if (totalPercentage > 100000) {
        throw new Error("Total percentage cannot exceed 100%");
      }

      // 4. Create new rule
      const newRule = new AllocationRule({
        userId: DEMO_USER_ID,
        incomeTypeId: data.incomeTypeId,
        version,
        isActive: true,
        effectiveFrom,
        rules: data.rules,
        totalPercentage,
        createdBy: DEMO_USER_ID
      });

      await newRule.save({ session });
      
      await session.commitTransaction();
      res.status(201).json({ success: true, data: newRule });
    } catch (error: any) {
      await session.abortTransaction();
      res.status(400).json({ success: false, error: error.message });
    } finally {
      session.endSession();
    }
  }

  static async getByIncomeType(req: Request, res: Response) {
    try {
      const { incomeTypeId } = req.params;
      const { page = 1, limit = DEFAULT_PAGE_LIMIT } = req.query;
      const query = {
        userId: DEMO_USER_ID,
        incomeTypeId
      };

      const rules = await AllocationRule.find(query)
        .sort({ version: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await AllocationRule.countDocuments(query);

      res.json({ 
        success: true, 
        data: rules,
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
