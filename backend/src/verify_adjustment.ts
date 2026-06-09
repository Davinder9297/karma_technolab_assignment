import mongoose from "mongoose";
import dotenv from "dotenv";
import { ExpenseService } from "./services/expenseService";
import { ReconciliationService } from "./services/reconciliationService";
import Bucket from "./models/Bucket";
import BucketBalance from "./models/BucketBalance";
import LedgerEntry from "./models/LedgerEntry";
import Expense from "./models/Expense";
import { DEMO_USER_ID } from "./utils/constants";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/budget_system";

async function verifyAdjustmentFlow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB...");

    // 0. Ensure clean state for Food bucket
    const foodBucket = await Bucket.findOne({ userId: DEMO_USER_ID, name: "Food" });
    if (!foodBucket) throw new Error("Food bucket not found");

    console.log(`--- STEP 0: CLEAN STATE ---`);
    await BucketBalance.findOneAndUpdate(
      { userId: DEMO_USER_ID, bucketId: foodBucket._id },
      { 
        $set: { 
          totalCredits: 3000000, 
          totalDebits: 0, 
          currentBalance: 3000000, 
          overspentAmount: 0 
        } 
      }
    );
    // Clear ledger for food to make verification easy (only keep the 30L allocation if you want, but for this test we'll just focus on the flow)
    // Actually let's keep one allocation entry of 30L to match user's expected ledger.
    await LedgerEntry.deleteMany({ userId: DEMO_USER_ID, bucketId: foodBucket._id });
    await new LedgerEntry({
      userId: DEMO_USER_ID,
      bucketId: foodBucket._id,
      referenceId: new mongoose.Types.ObjectId(),
      referenceModel: "Income",
      transactionType: "CREDIT",
      entryType: "ALLOCATION",
      amount: 3000000,
      balanceAfter: 3000000,
      date: new Date(),
      description: "Initial 30L Allocation"
    }).save();

    console.log("Food bucket reset to 30,00,000 paise.");

    // --- STEP 1: ADD NEW EXPENSE ---
    console.log(`\n--- STEP 1: ADD NEW EXPENSE (5,00,000) ---`);
    const expense = await ExpenseService.addExpense(
      DEMO_USER_ID,
      foodBucket._id.toString(),
      500000,
      new Date("2026-06-05"),
      "Groceries"
    );
    console.log("Expense created:", expense._id, "Status:", expense.status);

    // Verify Step 1
    const balanceStep1 = await BucketBalance.findOne({ userId: DEMO_USER_ID, bucketId: foodBucket._id });
    console.log("Current Balance:", balanceStep1?.currentBalance, "Total Debits:", balanceStep1?.totalDebits);

    // --- STEP 2: UPDATE THE EXPENSE ---
    console.log(`\n--- STEP 2: UPDATE THE EXPENSE (8,00,000) ---`);
    const updatedExpense = await ExpenseService.updateExpense(
      DEMO_USER_ID,
      expense._id.toString(),
      800000,
      "Groceries + household"
    );
    console.log("New Expense doc created:", updatedExpense._id);

    // --- STEP 3: VERIFY LEDGER ---
    console.log(`\n--- STEP 3: VERIFY LEDGER ---`);
    const ledgerEntries = await LedgerEntry.find({ 
      userId: DEMO_USER_ID, 
      bucketId: foodBucket._id 
    }).sort({ createdAt: 1 });

    ledgerEntries.forEach((entry, i) => {
      console.log(`${i+1}. Type: ${entry.entryType}, Tx: ${entry.transactionType}, Amount: ${entry.amount}, BalanceAfter: ${entry.balanceAfter}`);
    });

    // --- STEP 4: VERIFY BUCKET BALANCE DOC ---
    console.log(`\n--- STEP 4: VERIFY BUCKET BALANCE DOC ---`);
    const finalBalance = await BucketBalance.findOne({ userId: DEMO_USER_ID, bucketId: foodBucket._id });
    console.log("Final State:", JSON.stringify({
      totalCredits: finalBalance?.totalCredits,
      totalDebits: finalBalance?.totalDebits,
      currentBalance: finalBalance?.currentBalance
    }, null, 2));

    // --- STEP 5: RUN RECONCILIATION ---
    console.log(`\n--- STEP 5: RUN RECONCILIATION ---`);
    const recon = await ReconciliationService.runReconciliation(DEMO_USER_ID, 2026, 6);
    const foodResult = recon.results.find(r => r.bucketName === "Food");
    console.log("Reconciliation Result for Food:", JSON.stringify(foodResult, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

verifyAdjustmentFlow();
