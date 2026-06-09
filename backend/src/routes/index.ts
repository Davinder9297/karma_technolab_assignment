import { Router } from "express";
import { IncomeTypeController } from "../controllers/incomeTypeController";
import { BucketController } from "../controllers/bucketController";
import { AllocationRuleController } from "../controllers/allocationRuleController";
import { IncomeController } from "../controllers/incomeController";
import { ExpenseController } from "../controllers/expenseController";
import { DashboardController } from "../controllers/dashboardController";
import { LedgerController } from "../controllers/ledgerController";
import { ReconciliationController } from "../controllers/reconciliationController";

const router = Router();

// Income Types
router.post("/income-types", IncomeTypeController.create);
router.get("/income-types", IncomeTypeController.getAll);
router.patch("/income-types/:id", IncomeTypeController.update);

// Buckets
router.post("/buckets", BucketController.create);
router.get("/buckets", BucketController.getAll);
router.patch("/buckets/:id", BucketController.update);

// Allocation Rules
router.post("/allocation-rules", AllocationRuleController.create);
router.get("/allocation-rules/:incomeTypeId", AllocationRuleController.getByIncomeType);

// Incomes
router.post("/incomes", IncomeController.create);
router.get("/incomes", IncomeController.getAll);
router.patch("/incomes/:id", IncomeController.update);
router.delete("/incomes/:id", IncomeController.delete);

// Expenses
router.post("/expenses", ExpenseController.create);
router.get("/expenses", ExpenseController.getAll);
router.patch("/expenses/:id", ExpenseController.update);
router.delete("/expenses/:id", ExpenseController.delete);

// Dashboard
router.get("/dashboard/buckets", DashboardController.getBuckets);

// Ledger
router.get("/ledger", LedgerController.getAll);

// Reconciliation
router.post("/reconciliation/run", ReconciliationController.run);
router.post("/reconciliation/rebuild", ReconciliationController.rebuild);
router.get("/reconciliation/history", ReconciliationController.getHistory);

export default router;
