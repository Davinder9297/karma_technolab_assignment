"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Calendar, Receipt, Filter } from "lucide-react";
import api from "@/lib/api";
import { Expense, Bucket, ExpenseStatus } from "@/types";
import { toast } from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import { clsx } from "clsx";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    bucketId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });
  const [filterBucket, setFilterBucket] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filterBucket]);

  const fetchInitialData = async () => {
    try {
      const bRes = await api.get("/buckets");
      setBuckets(bRes.data.data);
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to fetch initial data");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await api.get("/expenses", {
        params: { bucketId: filterBucket }
      });
      setExpenses(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch expenses");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/expenses", {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success("Expense added successfully");
      setFormData({
        bucketId: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
      });
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add expense");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense? This will create a reversal ledger entry.")) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(paise / 100);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Add Expense Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-red-600" /> Add New Expense
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bucket</label>
            <select
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              value={formData.bucketId}
              onChange={(e) => setFormData({ ...formData, bucketId: e.target.value })}
            >
              <option value="">Select Bucket</option>
              {buckets.map(b => (
                <option key={b._id} value={b._id}>{b.name} ({formatCurrency(b.balance?.currentBalance || 0)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (INR)</label>
            <input
              type="number"
              required
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Food, Rent, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button
              type="submit"
              className="bg-red-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
            >
              Record Expense
            </button>
          </div>
        </form>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent Expenses</h3>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              className="text-xs font-bold text-slate-500 uppercase bg-transparent outline-none cursor-pointer"
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value)}
            >
              <option value="">All Buckets</option>
              {buckets.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Bucket</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr key={expense._id} className={clsx(
                "hover:bg-slate-50 transition-colors",
                expense.status !== ExpenseStatus.ACTIVE && "opacity-60 grayscale bg-slate-50"
              )}>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-900">{expense.bucketId?.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 italic">
                  {expense.description}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={expense.status === ExpenseStatus.ACTIVE ? "danger" : "slate"}>
                    {expense.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  {expense.status === ExpenseStatus.ACTIVE && (
                    <button 
                      onClick={() => handleDelete(expense._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
