import { z } from "zod";
import { RuleType } from "../types";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export const incomeTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const bucketSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const allocationRuleSchema = z.object({
  incomeTypeId: objectIdSchema,
  rules: z.array(z.object({
    bucketId: objectIdSchema,
    ruleType: z.enum([RuleType.PERCENTAGE, RuleType.FIXED]),
    value: z.number().int().positive(),
    priority: z.number().int().optional(),
  })).min(1, "At least one rule is required"),
  effectiveFrom: z.string().datetime().optional(),
});

export const incomeSchema = z.object({
  incomeTypeId: objectIdSchema,
  amount: z.number().positive("Amount must be positive"), // In Rupees, will be converted to paise
  date: z.string().datetime().or(z.coerce.date()),
  description: z.string().optional(),
  force: z.boolean().optional(),
});

export const expenseSchema = z.object({
  bucketId: objectIdSchema,
  amount: z.number().positive("Amount must be positive"), // In Rupees
  date: z.string().datetime().or(z.coerce.date()),
  description: z.string().min(1, "Description is required"),
});

export const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().datetime().or(z.coerce.date()).optional(),
});

export const reconciliationSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
