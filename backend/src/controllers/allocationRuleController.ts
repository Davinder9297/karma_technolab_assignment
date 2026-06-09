import mongoose from "mongoose";
import { Request, Response } from "express";
import AllocationRule from "../models/AllocationRule";
import { allocationRuleSchema } from "../validators";
import { DEMO_USER_ID } from "../utils/constants";
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
      const rules = await AllocationRule.find({
        userId: DEMO_USER_ID,
        incomeTypeId
      }).sort({ version: -1 });
      res.json({ success: true, data: rules });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
