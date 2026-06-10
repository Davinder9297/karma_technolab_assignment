import mongoose from "mongoose";
import AllocationRule from "../models/AllocationRule";
import { RuleType, AllocationResult } from "../types";
import Bucket from "../models/Bucket";

export class AllocationService {
  static async getAllocationRule(userId: string, incomeTypeId: string, date: Date) {
    const rule = await AllocationRule.findOne({
      userId,
      incomeTypeId,
      effectiveFrom: { $lte: date },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gt: date } }
      ]
    })
      .sort({ version: -1 })
      .exec();

    if (!rule) {
      throw new Error("No allocation rule found for this date and income type");
    }

    return rule;
  }

  static async calculateSplits(
    userId: string,
    rule: any,
    totalAmount: number // paise
  ): Promise<AllocationResult[]> {
    let remainingAmount = totalAmount;
    const allocations: AllocationResult[] = [];

    // Separate FIXED and PERCENTAGE rules
    const fixedRules = rule.rules.filter((r: any) => r.ruleType === RuleType.FIXED).sort((a: any, b: any) => a.priority - b.priority);
    const percentageRules = rule.rules.filter((r: any) => r.ruleType === RuleType.PERCENTAGE);

    // Fetch bucket names for results - Ensure we only use ACTIVE buckets
    const bucketIds = rule.rules.map((r: any) => r.bucketId.toString());
    const uniqueBucketIds = [...new Set(bucketIds)];
    const buckets = await Bucket.find({ 
      _id: { $in: uniqueBucketIds },
      userId,
      isActive: true 
    });
    
    const bucketMap = new Map(buckets.map((b) => [b._id.toString(), b.name]));

    // Check for missing or inactive buckets
    const missingBucketIds = uniqueBucketIds.filter(id => !bucketMap.has(id));
    if (missingBucketIds.length > 0) {
      throw new Error(`One or more buckets in the allocation rule are inactive or deleted: ${missingBucketIds.join(", ")}`);
    }

    // 1. Apply FIXED rules
    for (const r of fixedRules) {
      if (remainingAmount < r.value) {
        throw new Error(`Income amount is insufficient for fixed allocation to bucket: ${bucketMap.get(r.bucketId.toString())}`);
      }
      
      const allocated = r.value;
      allocations.push({
        bucketId: r.bucketId.toString(),
        bucketName: bucketMap.get(r.bucketId.toString()) || "Unknown",
        amount: allocated,
        amountINR: allocated / 100,
        ruleType: RuleType.FIXED,
        ruleValue: r.value,
      });
      remainingAmount -= allocated;
    }

    // 2. Apply PERCENTAGE rules
    const initialRemainingForPercentage = remainingAmount;
    let sumPercentageAllocated = 0;

    for (const r of percentageRules) {
      const allocated = Math.floor((initialRemainingForPercentage * r.value) / 100000);
      allocations.push({
        bucketId: r.bucketId.toString(),
        bucketName: bucketMap.get(r.bucketId.toString()) || "Unknown",
        amount: allocated,
        amountINR: allocated / 100,
        ruleType: RuleType.PERCENTAGE,
        ruleValue: r.value,
      });
      sumPercentageAllocated += allocated;
    }

    // 3. Handle Rounding and Unallocated
    const intendedPercentageTotal = Math.floor((initialRemainingForPercentage * rule.totalPercentage) / 100000);
    const roundingAdjustment = intendedPercentageTotal - sumPercentageAllocated;
    const unallocatedAmount = remainingAmount - intendedPercentageTotal;

    // Apply rounding adjustment to highest percentage bucket
    if (roundingAdjustment > 0 && percentageRules.length > 0) {
      const highestPercentageRule = percentageRules.reduce((prev: any, current: any) => (prev.value > current.value ? prev : current));
      const allocation = allocations.find((a) => a.bucketId === highestPercentageRule.bucketId.toString());
      if (allocation) {
        allocation.amount += roundingAdjustment;
        allocation.amountINR = allocation.amount / 100;
        allocation.note = "rounding_adjustment";
      }
    }

    // Add unallocated portion if any
    if (unallocatedAmount > 0) {
      allocations.push({
        bucketId: null,
        bucketName: "Unallocated",
        amount: unallocatedAmount,
        amountINR: unallocatedAmount / 100,
        ruleType: RuleType.PERCENTAGE,
        ruleValue: 0,
        note: "unallocated",
      });
    }

    return allocations;
  }
}
